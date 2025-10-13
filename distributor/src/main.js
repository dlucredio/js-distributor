// External imports
import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import { minimatch } from 'minimatch';

// ANTLR code imports
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";

// Internal imports
import config, { ConfigError } from "./config/Configuration.js";
import { writeJavaScriptFile } from "./helpers/GeneratorHelpers.js";
import JavaScriptGeneratorVisitor from "./visitors/JavaScriptGeneratorVisitor.js";
import { ReplaceRemoteFunctionsVisitor } from "./visitors/ReplaceRemoteFunctionsVisitor.js";
import { FixAsyncFunctionsVisitor } from "./visitors/FixAsyncFunctionsVisitor.js";
import { PrepareTreeVisitor } from "./visitors/PrepareTreeVisitor.js";
import { startServerTemplate } from "./templates/StartServer.js";
import ast from "./transformations/ASTModifications.js";
import npmHelper from "./helpers/NpmHelper.js";
import { dockerfileTemplate, composeTemplate } from "./templates/Docker.js";
import * as babelParser from "@babel/parser"

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
        const ASTs = [];
        const otherFiles = [];
        console.log(`======= Processing server ${s.id} ========`);
        parseCode(ASTs, otherFiles, inputDir);
        serverStructures.push({
            serverInfo: s,
            asts: ASTs,
            otherFiles: otherFiles
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
            
            const chars = new antlr4.InputStream(input);
            const lexer = new JavaScriptLexer(chars);
            const tokens = new antlr4.CommonTokenStream(lexer);
            const parser = new JavaScriptParser(tokens);
            parser.buildParseTrees = true;
            console.log(`Parsing file ${itemPath}`);
            const tree = parser.program();
            const prepareTreeVisitor = new PrepareTreeVisitor();
            prepareTreeVisitor.visit(tree);
            asts.push({
                relativePath: relativePath,
                tree: tree,
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
        for (const { relativePath, tree, babelTree } of asts) {
            const replaceRemoteFunctionsVisitor = new ReplaceRemoteFunctionsVisitor(
                serverInfo,
                relativePath,
                babelTree
            );
            replaceRemoteFunctionsVisitor.visitProgram(tree);
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

function fixAsyncFunctions(serverStructures, allRemoteFunctions) {
    const newAsyncFunctions = [];
    for (const { serverInfo, asts } of serverStructures) {
        // Let's filter only those functions for this server
        const allRemoteFunctionsInServer = allRemoteFunctions.filter(
            (rf) => rf.serverInfo.id === serverInfo.id
        );

        for (const { relativePath, tree } of asts) {
            const fixAsyncFunctionsVisitor = new FixAsyncFunctionsVisitor(
                serverInfo,
                relativePath,
                allRemoteFunctionsInServer,
                newAsyncFunctions
            );
            fixAsyncFunctionsVisitor.visitProgram(tree);
        }
    }
    if (newAsyncFunctions.length > 0) {
        fixAsyncFunctions(serverStructures, newAsyncFunctions);
    }
}

function generateStartCode(serverStructures, allExposedFunctions) {
    for (const { serverInfo, asts } of serverStructures) {
        console.log(`Generating start code for server ${serverInfo.id}`);
        const allExposedFunctionsInServer = allExposedFunctions.filter(
            (rf) => rf.serverInfo.id === serverInfo.id
        );
        const newCode = startServerTemplate(
            serverInfo,
            allExposedFunctionsInServer
        );
        const newTree = ast.generateCompleteTree(newCode);
        asts.push({
            relativePath: "start.js",
            tree: newTree,
        });
    }
}

function generateCode(serverStructures) {
    for (const { serverInfo, asts } of serverStructures) {
        const serverFolder = path.join(config.getCodeGenerationParameters().outputFolder, serverInfo.id);
        const sourceGenFolder = path.join(serverFolder, serverInfo.genFolder);

        for (const { relativePath, tree } of asts) {
            const javaScriptGeneratorVisitor = new JavaScriptGeneratorVisitor();
            javaScriptGeneratorVisitor.visitProgram(tree);
            const generatedCode = javaScriptGeneratorVisitor.getGeneratedCode();
            const javaScriptFile = path.join(sourceGenFolder, relativePath);
            writeJavaScriptFile(javaScriptFile, generatedCode);
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
        const remoteFunctionsInServer = allRemoteFunctions.filter(
            (rf) => rf.serverInfo.id === serverInfo.id
        );
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
