import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import config from './config/Configuration.js';
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import { createFoldersIfNecessary } from "./generators/GeneratorUtils.js";
import FunctionSeparator from "./generators/FunctionSeparator.js";

export default function main(
    mode,
    configFile,
    inputDirRelative,
    outputDirRelative
) {
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
        fs.watch(inputDir, {recursive: true}, fileChangeEvent);
    } else {
        console.log("Wrong usage.");
    }
}

function generate(inputDir, outputDir) {
    // First let's copy the original functions into the server folders,
    // only keeping the functions where they belong
    separateFunctionsIntoServers(inputDir, inputDir, outputDir);
}

/**
 * Recursive function that runs through all directories and input files, generating the corresponding 
 * code of functions and servers 
 * @param {*} inputDir - current input directory
 * @param {*} outputDir - output directory
 */
function separateFunctionsIntoServers(originalInputDir, inputDir, outputDir) {
    let items = fs.readdirSync(inputDir);

    for (let item of items) { // runs through items (files and directories) inside a directory
        const itemPath = path.join(inputDir, item);

        // if item is a directory, recursive call is made
        if (fs.statSync(itemPath).isDirectory()) {
            separateFunctionsIntoServers(originalInputDir, itemPath, outputDir)
        } else if (itemPath.slice(-2) === "js") { // if item is an input file, code generation is made
            try {
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

                const servers = config.getServers();
                for (const s of servers) {
                    functionSeparator.separate(s.id);
                    const serverCode = functionSeparator.getGeneratedCode();
                    const serverFolder = path.join(outputDir, s.id);
                    const outputFile = path.join(serverFolder, relativePath);
                    createFoldersIfNecessary(outputFile);
                    fs.writeFileSync(outputFile, serverCode, 'utf8');
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}