import antlr4 from "antlr4";
import beautify from "js-beautify";
import path from "path";
import fs from "fs";
import config from './config/Configuration.js';
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import FunctionGenerator from "./generators/FunctionGenerator.js";
import ServerGenerator from "./generators/ServerGenerator.js";
import { getAllJSFiles, getOrCreateServerSrcGenFolder } from "./generators/GeneratorUtils.js";
import DockerFileGenerator from "./generators/DockerFileGenerator.js";

let serverPorts = {}; // stores the ports of each server
let functionNames = {}; // stores the names of each function
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
    generateFunctionFiles(inputDirRelative, outputDir);
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
        generateFunctionFiles(inputDirRelative, outputDir);
      }
    };

    fs.watch(configFile, fileChangeEvent);
    fs.watch(inputDir, fileChangeEvent);
  } else {
    console.log("Wrong usage.");
  }
}

/**
 * Recursive function that runs through all directories and input files, generating the corresponding 
 * code of functions and servers 
 * @param {*} inputDir - current input directory
 * @param {*} outputDir - output directory
 * @param {*} filesInitialized - already initialized files array  
 * @returns - array with files initialized
 */
function generateFunctionFiles(inputDir, outputDir, filesInitialized = []) {
  let items = fs.readdirSync(inputDir);

  for (let item of items) { // runs through items (files and directories) inside a directory
    const itemPath = path.join(inputDir, item);

    // if item is a directory, recursive call is made
    if (fs.statSync(itemPath).isDirectory()) {
      filesInitialized = generateFunctionFiles(itemPath, outputDir, filesInitialized)
    } else if (itemPath.slice(-2) === "js") { // if item is an input file, code generation is made
      try {
        // get semantic tree
        const input = fs.readFileSync(itemPath, { encoding: "utf8" });
        const chars = new antlr4.InputStream(input);
        const lexer = new JavaScriptLexer(chars);
        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new JavaScriptParser(tokens);
        parser.buildParseTrees = true;
        const tree = parser.program();

        // generator of functions of each server
        const functionGenerator = new FunctionGenerator();
        const modifiedNodeCode = functionGenerator.generateFunctions(tree);

        // runs through all generated functions codes
        for (var [serverName, code] of modifiedNodeCode) {
          const srcGenFolder = getOrCreateServerSrcGenFolder(outputDir, serverName);
          const outputFile = path.join(srcGenFolder, `functions-${serverName}.js`);
          //TODO: add function names cache.
          // if file does not exist or execution is being done again, new empty file is created
          if (!fs.existsSync(outputFile) || !filesInitialized.includes(outputFile)) {
            fs.writeFileSync(
              outputFile,
              generateInitialCode(inputDir, "function"), // initial code of function file
            );
            filesInitialized.push(outputFile);
          }
          functionNames[serverName] = outputFile;
          // append of generated code 
          if (code !== null) {
            fs.appendFileSync(
              outputFile,
              '\n' + beautify(code, {
                indent_size: 4,
                space_in_empty_paren: true,
              }),
              (err) => {
                if (err) {
                  console.error('Error adding content to file:', err);
                }
              });
          }
        }

        // server code generator 
        const serverGenerator = new ServerGenerator();
        const modifiedServerCode = serverGenerator.generateFunctions(tree, filesInitialized);


        // runs through all generated servers codes
        for (var [serverName, code] of modifiedServerCode) {
          const srcGenFolder = getOrCreateServerSrcGenFolder(outputDir, serverName);
          const outputFile = path.join(srcGenFolder,`start-${serverName}.js`);
          serverPorts[serverName] = {
            "port": getPortOfServer(serverName),
            "filePath": outputFile
          }
          if (!fs.existsSync(outputFile) || !filesInitialized.includes(outputFile)) {
            fs.writeFileSync(
              outputFile,
              generateInitialCode(inputDir, "server", serverName), // initial code of server file
            );
            filesInitialized.push(outputFile);
          }

          if (code !== null) {
            fs.appendFileSync(
              outputFile,
              '\n' + beautify(code, {
                indent_size: 4,
                space_in_empty_paren: true,
              }),
              (err) => {
                if (err) {
                  console.error('Error adding content to file:', err);
                }
              });
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
  return filesInitialized;
}


/**
 * Initialize server and functions files with necessary and static code 
 * @param {*} typeOfCode - 'function' ou 'server': indicate wheater to initialize with server or 
 * function code 
 * @param {*} serverName  
 * @returns - initial code to initialize file
 */
function generateInitialCode(inputDir, typeOfCode, serverName) {
  if (typeOfCode === 'function') {
    let code = "import fetch from 'node-fetch';\n";
    code += `import amqp from 'amqplib';`
    return code;
  } else if (typeOfCode === 'server') {
    let code = "import express from 'express';\n";
    code += "const app = express();\n";
    code += `const port = ${getPortOfServer(serverName)};\n`;
    code += `app.use(express.json());\n`;
    code += `app.listen(port, () => {\n`;
    code += `  console.log('Server running in port ' + port);\n`;
    code += `});\n`;
    code += `import amqp from 'amqplib';`

    code += generateGlobalElements(inputDir, serverName);

    return code;
  }
};

function generateGlobalElements(inputDir, serverName) {
  try {
    const jsFiles = getAllJSFiles(inputDir);

    let code = '';

    for (let jsFile of jsFiles) {
      const input = fs.readFileSync(jsFile, { encoding: "utf8" });
      const chars = new antlr4.InputStream(input);
      const lexer = new JavaScriptLexer(chars);
      const tokens = new antlr4.CommonTokenStream(lexer);
      const parser = new JavaScriptParser(tokens);
      parser.buildParseTrees = true;
      const tree = parser.program();

      const serverGenerator = new ServerGenerator();
      code += serverGenerator.generateGlobalElements(jsFile, tree, serverName, config);

    }

    return code;

  } catch (e) {
    console.error(`Error generating global elements for server ${serverName}: `, e);
  }

}


/**
 * Get port from a given server
 * @param {*} serverName 
 * @returns - port associated to the given server 
 */
function getPortOfServer(serverName) {
  let serverInfo = config.servers.find((server) => server.id === serverName);
  return serverInfo.port;
}


/**
 * Generate server code
 * @param {*} inputDir - generated files directory, the output from @generateFunctionFiles
 * @param {*} outputDir - output directory
 */
function generateProjects(inputDir, outputDir) {
  var dockerGen = new DockerFileGenerator(outputDir, functionNames);
  for (let serverName in serverPorts) {
    let serverInfo = serverPorts[serverName];
    dockerGen.generateProject(serverName, serverInfo.filePath, serverInfo.port);
  }
}
