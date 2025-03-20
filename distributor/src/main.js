import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import beautify from "js-beautify";
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import CopyPasteGenerator from "./generators/copypaste-generator.js";
import FunctionGenerator from "./generators/FunctionGenerator.js";
import ServerGenerator from "./generators/ServerGenerator.js";
import { getAllJSFiles } from "./generators/generator-utils.js";
import DockerFileGenerator from "./generators/DockerFileGenerator.js";


let serverPorts = {}; // stores the ports of each server
let functionNames = {}; // stores the names of each function
export default function main(
  mode,
  target,
  inputDirRelative,
  outputDirRelative,
  aux
) {
  const inputDir = path.resolve(path.join(".", inputDirRelative));
  const outputDir = path.resolve(path.join(".", outputDirRelative));

  fs.mkdirSync(outputDir, { recursive: true }, (err) => {
    console.log(err);
  });

  if (mode === "single") {
    // generateCodeDir(target, inputDirRelative, outputDir);
    generateFunctionFiles(inputDirRelative, outputDir, target);
  } else if (mode === "watch") {
    let fsWait = false;

    console.log(`Watching ${inputDir} and config.yml for changes...`);

    fs.watch('config.yml', (event, filename) => {
      if (filename) {
        if (fsWait) return;
        fsWait = true;
        setTimeout(() => {
          fsWait = false;
        }, 500);
        console.log(
          `File ${filename} has changed (${event}). Generating code and function files again...`
        );
        // generateCodeDir(target, inputDirRelative, outputDir);
        generateFunctionFiles(inputDirRelative, outputDir, target);
      }
    });

    fs.watch(inputDir, { recursive: true }, (event, filename) => {
      if (filename) {
        if (fsWait) return;
        fsWait = true;
        setTimeout(() => {
          fsWait = false;
        }, 500);
        console.log(
          `File ${filename} has changed (${event}). Generating code and function files again...`
        );
        // generateCodeDir(target, inputDirRelative, outputDir);
        generateFunctionFiles(inputDirRelative, outputDir, target);
      }
    });
  }else if (mode === "generateProjects" && aux) {
    generateFunctionFiles(inputDirRelative, outputDir, target);
    generateProjects(outputDir, aux);
  }else {
    console.log("Wrong usage! Learn!");
  }
}

function generateCodeDir(target, inputDir, outputDir) {
  fs.readdir(inputDir, (err, items) => {
    if (err) {
      console.log("Error reading ", inputDir);
    }

    items.forEach((item) => {
      const itemPath = path.join(inputDir, item);

      const isDirectory = fs.statSync(itemPath).isDirectory();

      if (isDirectory) {
        generateCodeDir(target, itemPath, outputDir)
      } else {
        const outputFile = path.join(outputDir, itemPath.slice(3));
        generateCode(target, itemPath, outputFile);
      }
    })
  });
}

function generateCode(target, inputFile, outputFile) {
  try {
    console.log(`Generating ${inputFile} -> ${outputFile}`);

    const input = fs.readFileSync(inputFile, { encoding: "utf8" });
    const chars = new antlr4.InputStream(input);
    const lexer = new JavaScriptLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new JavaScriptParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.program();

    let generatedContent = null;

    if (target === "copypaste") {
      const generator = new CopyPasteGenerator();
      generator.visitProgram(tree);
      generatedContent = generator.stringBuilder.toString();
    }

    if (fs.existsSync(outputFile)) {
      fs.rmSync(outputFile);
    }

    const directoryPath = path.dirname(outputFile);

    fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
      console.log(err);
    });

    if (generatedContent !== null) {
      fs.writeFileSync(
        outputFile,
        beautify(generatedContent, {
          indent_size: 4,
          space_in_empty_paren: true,
        })
      );
    }
  } catch (e) {
    console.log(e);
  }
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
    const yamlPath = path.resolve("config.yml");
    const config = yaml.load(fs.readFileSync(yamlPath, "utf8"));

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
  const yamlPath = './config.yml';
  const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
  let serverInfo = config.servers.find((server) => server.id === serverName);
  return serverInfo.port;
}

/**
 * Recursive function that runs through all directories and input files, generating the corresponding 
 * code of functions and servers 
 * @param {*} inputDir - current input directory
 * @param {*} outputDir - output directory
 * @param {*} target - target of generation
 * @param {*} filesInitialized - already initialized files array  
 * @returns - array with files initialized
 */
function generateFunctionFiles(inputDir, outputDir, target, filesInitialized = []) {
  let items = fs.readdirSync(inputDir);
  
  for (let item of items) { // runs through items (files and directories) inside a directory
    const itemPath = path.join(inputDir, item);

    // if item is a directory, recursive call is made
    if (fs.statSync(itemPath).isDirectory()) {
      filesInitialized = generateFunctionFiles(itemPath, outputDir, target, filesInitialized)
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
        for (var [key, code] of modifiedNodeCode) {
          let outputFile = path.join(outputDir, item);
          outputFile = `./src-gen/functions-${key}.js`;
          //TODO: add function names cache.
          // if file does not exist or execution is being done again, new empty file is created
          if (!fs.existsSync(outputFile) || !filesInitialized.includes(outputFile)) {
            fs.writeFileSync(
              outputFile,
              generateInitialCode(inputDir, "function"), // initial code of function file
            );
            filesInitialized.push(outputFile);
          }
          functionNames[key] = outputFile;
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
                  console.error('Erro ao adicionar conteúdo ao arquivo:', err);
                }
              });
          }
        }

        // server code generator 
        const serverGenerator = new ServerGenerator();
        const modifiedServerCode = serverGenerator.generateFunctions(tree, filesInitialized);
        
        
        // runs through all generated servers codes
        for (var [key, code] of modifiedServerCode) {
          let outputFile = path.join(outputDir, item);
          outputFile = `./src-gen/start-${key}.js`;
          serverPorts[key] = {
            "port": getPortOfServer(key),
            "filePath": outputFile
          }
          if (!fs.existsSync(outputFile) || !filesInitialized.includes(outputFile)) {
            fs.writeFileSync(
              outputFile,
              generateInitialCode(inputDir, "server", key), // initial code of server file
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
                  console.error('Erro ao adicionar conteúdo ao arquivo:', err);
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
 * Generate server code
 * @param {*} inputDir - generated files directory, the output from @generateFunctionFiles
 * @param {*} outputDir - output directory
 */
function generateProjects(inputDir, outputDir) {
  var dockerGen = new DockerFileGenerator(outputDir, functionNames);
  
  console.log("Items: ", functionNames);
  console.log(inputDir + " - ");
  for (let serverName in serverPorts) {
    
    let serverInfo = serverPorts[serverName];
    console.log(`Server: ${serverName}, Port: ${serverInfo.port}, File Path: ${serverInfo.filePath}`);
    dockerGen.generateProject(serverName, serverInfo.filePath, serverInfo.port);
    //Pass the filename path for only servers(start-*.js) to the docker generator
    //Copy the server file to the output directory
    //dockerGen.generateProject(itemPath);
  }
}
