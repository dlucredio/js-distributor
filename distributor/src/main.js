// External imports
import path from "path";
import fs from "fs";
import { minimatch } from 'minimatch';

// Babel imports
import * as babelParser from "@babel/parser"
import generate from "@babel/generator";
const babelGenerate = generate.default ?? generate;

// Internal imports
import config, { ConfigError } from "./config/Configuration.js";
import { writeJavaScriptFile } from "./helpers/GeneratorHelpers.js";
import { ReplaceRemoteFunctionsVisitor } from "./visitors/ReplaceRemoteFunctionsVisitor.js";
import { FixAsyncFunctionsVisitor } from "./visitors/FixAsyncFunctionsVisitor.js";
import { startServerTemplate } from "./templates/StartServer.js";
import npmHelper from "./helpers/NpmHelper.js";
import { dockerfileTemplate, composeTemplate } from "./templates/Docker.js";


export default async function entrypoint(configFile) {
    try {
        config.init(configFile);
        console.log(`Loaded configuration file ${configFile}`);

        if (config.getCodeGenerationParameters().cleanOutput) {
            const outputFolder = config.getCodeGenerationParameters().outputFolder;
            console.log(`Cleaning directory ${outputFolder}`);
            await fs.promises.rm(outputFolder, { recursive: true, force: true });
            console.log(`Output directory successfully erased!`);
        }

        if (config.getCodeGenerationParameters().mode === "single") {
            process();
        } else if (config.getCodeGenerationParameters().mode === "watch") {
            let fsWait = false;

            console.log(`Watching ${config.getCodeGenerationParameters().inputFolder} and ${configFile} for changes...`);

            const fileChangeEvent = (event, filename) => {
                if (filename) {
                    if (fsWait) return;
                    fsWait = true;
                    setTimeout(() => {
                        fsWait = false;
                    }, 500);
                    console.log(
                        `File ${filename} has changed (${event}). Generating code and function files again...`
                    );
                    process();
                }
            };

            fs.watch(configFile, fileChangeEvent);
            fs.watch(config.getCodeGenerationParameters().inputFolder, { recursive: true }, fileChangeEvent);
        }
    } catch (e) {
        if (e instanceof ConfigError) {
            console.error(e.message);
        } else {
            throw e;
        }
    }
}

async function process() {
    const inputDir = config.getCodeGenerationParameters().inputFolder;
    const generateProjects = config.getCodeGenerationParameters().generateProjects;
    const generateDocker = config.getCodeGenerationParameters().generateDocker;

    console.log(`Starting to process directory ${inputDir}`);

    // Let's duplicate the monolith structure for each server
    const serverStructures = [];
    const servers = config.getServers();
    for (const s of servers) {
        let s_copy = JSON.parse(JSON.stringify(s));
        s_copy.id = s.id + "-test-server";
        const ASTs = [];
        const otherFiles = [];
        const testOtherFiles = [];
        const ASTs_copy = [];
        console.log(`======= Processing server ${s.id} ========`);
        parseCode(ASTs, otherFiles, inputDir);
        parseCode(ASTs_copy, testOtherFiles, inputDir);
        serverStructures.push({
            serverInfo: s,
            asts: ASTs,
            otherFiles: otherFiles
        });
        serverStructures.push({
            serverInfo: s_copy,
            asts: ASTs_copy,
            otherFiles: testOtherFiles
        });
    }

    // We replace all remote functions with a remote call
    const [allRemoteFunctions, allExposedFunctions] =
        replaceRemoteFunctions(serverStructures);

    // Now we need to generate the code to start the servers
    generateStartCode(serverStructures, allExposedFunctions);

    // Because we added async to these functions, we must now
    // find all places where they are called and add an await
    fixAsyncFunctions(serverStructures, allRemoteFunctions);

    // Now we need to generate the code to start the servers
    generateStartCode(serverStructures, allExposedFunctions);
    
    if(config.isTestServer()) {
        generateStartCodeTest(serverStructures, allExposedFunctions);
        generateApiTestCode(serverStructures, allExposedFunctions);
    }
    // Now let's generate the final code: one folder for each server
    generateCode(serverStructures);

    // Finally, we copy the non-source code files
    copyOtherFiles(serverStructures);


    // Finally, we initialize the NPM projects (if the user requested it)
    if (generateProjects) {
        await initializeProjects(serverStructures, allRemoteFunctions);
    }

    // And create the Docker infrastructure (if the user requested it)
    if (generateDocker) {
        generateDockerInfrastructure(serverStructures);
    }

    copyAdditionalFiles(serverStructures);

    console.log(`Done!`);
}

function parseCode(asts, otherFiles, inputDir) {
    // First let's parse the original code for the project
    // and store it in a proper structure
    let items = fs.readdirSync(inputDir);
    const ignoreList = config.getCodeGenerationParameters().ignore;
    for (let item of items) {
        const itemPath = path.join(inputDir, item);
        if (ignoreList.some(pattern => minimatch(item, pattern))) {
            let itemType = "file";
            if (fs.statSync(itemPath).isDirectory()) {
                itemType = "folder";
            }
            console.log(`Ignoring ${itemType} "${itemPath}"`);
            continue;
        }
        const relativePath = path.relative(config.getCodeGenerationParameters().inputFolder, itemPath);

        // if item is a directory, recursive call is made
        if (fs.statSync(itemPath).isDirectory()) {
            parseCode(asts, otherFiles, itemPath);
        } else if (itemPath.slice(-2) === "js") {
            // if item is an input file, let's parse it
            // Let's parse the file
            const input = fs.readFileSync(itemPath, { encoding: "utf8" });

            const ast = babelParser.parse(input, {
                sourceType: "module", 
            });
            
            console.log(`Parsed file ${itemPath}`);
            asts.push({
                relativePath: relativePath,
                babelTree: ast
            });
        } else {
            otherFiles.push({
                relativePath: relativePath
            });
        }
    }
}

function replaceRemoteFunctions(serverStructures) {
    const allRemoteFunctions = [];
    const allExposedFunctions = [];
    for (const { serverInfo, asts } of serverStructures) {
        for (const { relativePath, babelTree } of asts) {
            const replaceRemoteFunctionsVisitor = new ReplaceRemoteFunctionsVisitor(
                serverInfo,
                relativePath
            );
            replaceRemoteFunctionsVisitor.visitFunctionDeclarationWrapper(babelTree);
            allRemoteFunctions.push(
                ...replaceRemoteFunctionsVisitor.getRemoteFunctions()
            );
            allExposedFunctions.push(
                ...replaceRemoteFunctionsVisitor.getExposedFunctions()
            );
        }
    }
    return [allRemoteFunctions, allExposedFunctions];
}

function fixAsyncFunctions(serverStructures, babelAllRemoteFunctions) {
    const babelNewAsyncFunctions = [];
    for (const { serverInfo, asts } of serverStructures) {
        // Let's filter only those functions for this server
        const allBabelRemoteFunctionsInServer = babelAllRemoteFunctions.filter(
            (rf) => rf.serverInfo.id === serverInfo.id
        );

        for (const { relativePath, babelTree } of asts) {
            const fixAsyncFunctionsVisitor = new FixAsyncFunctionsVisitor(
                serverInfo,
                relativePath,
                babelNewAsyncFunctions,
                allBabelRemoteFunctionsInServer
            );
            fixAsyncFunctionsVisitor.babelWrapperVisitCallExpression(babelTree);
        }
    }
    if (babelNewAsyncFunctions.length > 0) {
        fixAsyncFunctions(serverStructures, babelNewAsyncFunctions);
    }
}

function generateStartCode(serverStructures, allExposedFunctions) {
    for (const { serverInfo, asts } of serverStructures) {
        console.log(`Generating start code for server ${serverInfo.id}`);
        const allExposedFunctionsInServer = getServerFunctions(allExposedFunctions, serverInfo);
        const newCode = serverInfo.id.includes("test-server") ?  startTestServerTemplate(
            serverInfo,
            allExposedFunctionsInServer
        ) : startServerTemplate(
            serverInfo,
            allExposedFunctionsInServer
        );
        const babelNewTree = babelParser.parse(newCode, {sourceType: "module"});
        asts.push({
            relativePath: "start.js",
            babelTree: babelNewTree
        });
    }
}

function generateCode(serverStructures) {
    for (const { serverInfo, asts } of serverStructures) {
        const serverFolder = path.join(config.getCodeGenerationParameters().outputFolder, serverInfo.id);
        const sourceGenFolder = path.join(serverFolder, serverInfo.genFolder);

        for (const { relativePath, babelTree } of asts) {
            const javaScriptFile = path.join(sourceGenFolder, relativePath);
            const { code: output } = babelGenerate(babelTree);

            writeJavaScriptFile(javaScriptFile, output);
        }
    }
}

function copyOtherFiles(serverStructures) {
    for (const { serverInfo, otherFiles } of serverStructures) {
        const serverFolder = path.join(config.getCodeGenerationParameters().outputFolder, serverInfo.id);
        const sourceGenFolder = path.join(serverFolder, serverInfo.genFolder);

        for (const { relativePath } of otherFiles) {
            const sourcePath = path.join(config.getCodeGenerationParameters().inputFolder, relativePath);
            const destinationPath = path.join(sourceGenFolder, relativePath);
            fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

async function initializeProjects(serverStructures, allRemoteFunctions) {
    for (const { serverInfo } of serverStructures) {
        const serverFolder = path.join(config.getCodeGenerationParameters().outputFolder, serverInfo.id);
        const remoteFunctionsInServer = getServerFunctions(allRemoteFunctions, serverInfo);
        await npmHelper.initNodeProject(
            serverFolder,
            serverInfo,
            remoteFunctionsInServer
        );
    }
}

function generateDockerInfrastructure(serverStructures) {
    const outputDir = config.getCodeGenerationParameters().outputFolder;

    console.log("Generating Docker infrastructure");
    for (const { serverInfo } of serverStructures) {
        const serverFolder = path.join(outputDir, serverInfo.id);
        const dockerfileContent = dockerfileTemplate(serverInfo).trim();
        const dockerfile = path.join(serverFolder, "Dockerfile");
        fs.writeFileSync(dockerfile, dockerfileContent);
        console.log(`Created file ${dockerfile}`);
    }

    const composeFile = path.join(outputDir, "compose.yaml");
    const composeContent = composeTemplate(serverStructures).trim();
    fs.writeFileSync(composeFile, composeContent);
    console.log(`Created file ${composeFile}`);
}

function copyAdditionalFiles(serverStructures) {
    for (const { serverInfo } of serverStructures) {
        if (serverInfo.copyFiles && Array.isArray(serverInfo.copyFiles)) {
            const serverFolder = path.join(config.getCodeGenerationParameters().outputFolder, serverInfo.id);
            const sourceGenFolder = path.join(serverFolder, serverInfo.genFolder);
            for (const { from, to } of serverInfo.copyFiles) {
                const sourcePath = path.join(config.getConfigPath(), from);
                const destinationPath = path.join(sourceGenFolder, to);
                console.log(`Copying file from ${sourcePath} to ${destinationPath}`);
                fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
                fs.copyFileSync(sourcePath, destinationPath);
            }
        }
    }
}

function generateStartCodeTest(serverStructures, allExposedFunctions) {
    for (const { serverInfo, asts } of serverStructures) {
        console.log(`Generating start code for test server ${serverInfo.id}`);
        const allExposedFunctionsInServer = allExposedFunctions.filter(
            (rf) => rf.serverInfo.id === serverInfo.id
        );
        const newCode = startTestServerTemplate(
            serverInfo,
            allExposedFunctionsInServer
        );
        const newTree = ast.generateCompleteTree(newCode);
        asts.push({
            relativePath: "start_test_server.js",
            tree: newTree,
        });
    }
}

function generateApiTestCode(serverStructures, allExposedFunctions){
    /*serverStructures: [{
        serverInfo: s,
        asts: [{
            relativePath: relativePath,
            tree: tree
        }],
        otherFiles: otherFiles}]*/

        // iterar pela lista de serverStructures
            // iterar pela lista de asts 
                // verificar se o relativePath é igual a um test
                    //Se for um test
                        // usar a arvore do arquivo para buscar por funções expostas localmente
                            //para os testes expostos localmente, copiar o codigo de teste e trocar a chamada do metodo.
    for (const { serverInfo, asts } of serverStructures) {
        for (const { relativePath, tree } of asts) {
            if(relativePath.includes(".test.")) {
                const exposedFunctions = allExposedFunctions.filter(
                    (ef) => ef.serverInfo.id === serverInfo.id
                );

                const testRouteVisitor = new TestRouteVisitor(serverInfo, relativePath, tree);
                testRouteVisitor.replaceTestApiCall();
            }
        }
    }
}

function getServerFunctions(allFunctions, serverInfo){
    return allFunctions.filter(
            (rf) => rf.serverInfo.id === serverInfo.id
    );
}