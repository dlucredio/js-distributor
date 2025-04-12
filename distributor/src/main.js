import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import config, { ConfigError } from './config/Configuration.js';
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import { writeJavaScriptFile } from "./generators/GeneratorUtils.js";
import FunctionSeparator from "./generators/FunctionSeparator.js";
import ServerGenerator from "./generators/ServerGenerator.js";

export default function main(
    mode,
    configFile,
    inputDirRelative,
    outputDirRelative
) {
    try {
        config.init(configFile);

        console.log(`Loaded configuration file ${configFile}`)

        const inputDir = path.resolve(path.join(".", inputDirRelative));
        const outputDir = path.resolve(path.join(".", outputDirRelative));

        if (mode === "single") {
            generate(inputDir, outputDir);
        } else if (mode === "watch") {
            let fsWait = false;

            console.log(`Watching ${inputDir} and ${configFile} for changes...`);

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
                    generate(inputDir, outputDir);
                }
            };

            fs.watch(configFile, fileChangeEvent);
            fs.watch(inputDir, { recursive: true }, fileChangeEvent);
        } else {
            console.log("Wrong usage.");
        }
    } catch (e) {
        if (e instanceof ConfigError) {
            console.error(e.message);
        } else {
            throw e;
        }
    }
}

function generate(inputDir, outputDir) {
    console.log("Generating code...");
    // First let's copy the original functions into the server folders,
    // replacing remote functions with remote calls
    const functionsToBeExposed = {};

    const servers = config.getServers();
    for (const s of servers) {
        functionsToBeExposed[s.id] = {
            serverInfo: s,
            functionsToBeExposedInServer: []
        };
    }

    separateFunctionsIntoServers(functionsToBeExposed, inputDir, inputDir, outputDir);

    // Now let's generate the server initialization code
    generateServerInitializationCode(functionsToBeExposed, outputDir);

    console.log("Done!");
}

/**
 * Recursive function that runs through all directories and input files, generating the corresponding 
 * code of functions and servers 
 * @param {*} inputDir - current input directory
 * @param {*} outputDir - output directory
 */
function separateFunctionsIntoServers(functionsToBeExposed, originalInputDir, inputDir, outputDir) {
    let items = fs.readdirSync(inputDir);
    const servers = config.getServers();

    for (let item of items) { // runs through items (files and directories) inside a directory
        const itemPath = path.join(inputDir, item);

        // if item is a directory, recursive call is made
        if (fs.statSync(itemPath).isDirectory()) {
            separateFunctionsIntoServers(functionsToBeExposed, originalInputDir, itemPath, outputDir)
        } else if (itemPath.slice(-2) === "js") { // if item is an input file, code generation is made
            // Let's parse the file
            const relativePath = path.relative(originalInputDir, itemPath);
            const input = fs.readFileSync(itemPath, { encoding: "utf8" });
            const chars = new antlr4.InputStream(input);
            const lexer = new JavaScriptLexer(chars);
            const tokens = new antlr4.CommonTokenStream(lexer);
            const parser = new JavaScriptParser(tokens);
            parser.buildParseTrees = true;
            const tree = parser.program();
            const functionSeparator = new FunctionSeparator(tree);

            for (const s of servers) {
                // Now we separate the functions for each server
                // If a function is assigned to a server, we just copy it
                // If not, we substitute the original function body by
                // a remote call.
                // All remote functions are returned so that we can later
                // generate the server initialization code
                const functionsToBeExposedInServer = functionSeparator.separate(s.id);
                const serverCode = functionSeparator.getGeneratedCode();
                const serverFolder = path.join(outputDir, s.id);
                const sourceGenFolder = path.join(serverFolder, s.genFolder);
                const outputFile = path.join(sourceGenFolder, relativePath);

                writeJavaScriptFile(outputFile, serverCode);

                // Now let's save the data for the remote functions
                for(const rf of functionsToBeExposedInServer) {
                    functionsToBeExposed[s.id].functionsToBeExposedInServer.push({
                        ...rf,
                        path: relativePath
                    });
                }
            }
        }
    }
}

function generateServerInitializationCode(functionsToBeExposed, outputDir) {
    for(const [serverId, ftbe] of Object.entries(functionsToBeExposed)) {
        const serverFolder = path.join(outputDir, serverId);
        const sourceGenFolder = path.join(serverFolder, ftbe.serverInfo.genFolder);
        const outputFile = path.join(sourceGenFolder, `start_${serverId}.js`);
        const serverInitializationCode = ServerGenerator.generateServerInitializationCode(ftbe.serverInfo, ftbe.functionsToBeExposedInServer);
        writeJavaScriptFile(outputFile, serverInitializationCode);
    }
}