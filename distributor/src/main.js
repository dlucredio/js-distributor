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
import WaitForCallGenerator from "./generators/WaitForCallGenerator.js";

export default function main(
  mode,
  target,
  inputDirRelative,
  outputDirRelative
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

    console.log(`Watching ${inputDir} for changes...`);

    fs.watch(inputDir, (event, filename) => {
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
  } else {
    console.log("Wrong usage! Learn!");
  }
}

function generateCodeDir(target, inputDir, outputDir) {
  fs.readdir(inputDir, (err, items) => {
    if (err) {
      console.log("erro ao ler", inputDir);
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
 * Inicializa arquivos de servidores e funções com código estático necessário
 * @param {*} typeOfCode - 'function' ou 'server': indica se deve inicializar com código do servidor
 * ou function 
 * @param {*} serverName - nome do servidor   
 * @returns - código inicial que que inicializa arquivo
 */
function generateInitialCode(typeOfCode, serverName) {
  if (typeOfCode === 'function'){
    let code = "import fetch from 'node-fetch';\n";
    code += `import amqp from 'amqplib';`
    return code;
  } else if (typeOfCode === 'server') {
    let code = "import express from 'express';\n";
    code += "const app = express();\n";
    code += `const port = ${getPortOfServer(serverName)};\n`; 
    code += `app.use(express.json());\n`;
    code += `app.listen(port, () => {\n`;
    code += `  console.log('Servidor rodando na porta ' + port);\n`;
    code += `});\n`;
    code += `import amqp from 'amqplib';`
    return code;
  }
};

/**
 * Obtém porta de um dado servidor
 * @param {*} serverName - nome do servidor buscado
 * @returns - porta do servidor desejado
 */
function getPortOfServer(serverName) {
  const yamlPath = './config4.yml';
  const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
  let serverInfo = config.servers.find((server) => server.id === serverName);
  return serverInfo.port;
}

/**
 * Função recursiva que percorre todos diretorios e arquivos de entrada gerando o codigo corresponde 
 * das funções e servidores
 * @param {*} inputDir - diretório corrente de entrada
 * @param {*} outputDir - diretório de saida 
 * @param {*} target - target de geração
 * @param {*} filesInitialized - array de arquivos já inicializados 
 * @returns - array de arquivos inicializados
 */
function generateFunctionFiles(inputDir, outputDir, target, filesInitialized=[]) {
  let items = fs.readdirSync(inputDir);
  for (let item of items) { // percorre itens (arquivos e diretórios) dentro de um diretorio
    const itemPath = path.join(inputDir, item);

    // se item é um diretorio, fazer chamada recursiva
    if (fs.statSync(itemPath).isDirectory()) {
      filesInitialized = generateFunctionFiles(itemPath, outputDir, target, filesInitialized)
    } else if (itemPath.slice(-2) === "js") { // se item é um arquivo de entrada, gerar código
      try {
        // obtenção árvore semântica
        const input = fs.readFileSync(itemPath, { encoding: "utf8" });
        const chars = new antlr4.InputStream(input);
        const lexer = new JavaScriptLexer(chars);
        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new JavaScriptParser(tokens);
        parser.buildParseTrees = true;
        const tree = parser.program();

        // Gerador das funcoes de cada servidor isoladas
        const functionGenerator = new FunctionGenerator();
        const modifiedNodeCode = functionGenerator.generateFunctions(tree);
        
        // percorre todos codigos de funcoes gerados para todos servidores
        for (var [key, code] of modifiedNodeCode) {
          let outputFile = path.join(outputDir, item);
          outputFile = `./src-gen/functions-${key}.js`;
          
          // se arquivo nao existe ou execucao esta sendo feito novamente, cria arquivo
          if (!fs.existsSync(outputFile) || !filesInitialized.includes(outputFile)) {
            fs.writeFileSync(
              outputFile,
              generateInitialCode("function"), // codigo inicial do arquivo de funcoes
            );
            filesInitialized.push(outputFile);
          }

          // da append do codigo gerado no arquivo de funções
          if (code !== null) {
            fs.appendFileSync(
              outputFile, 
              '\n'+beautify(code, {
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

      // Gerador de servidores express
      const serverGenerator = new ServerGenerator();  
      const modifiedServerCode = serverGenerator.generateFunctions(tree, filesInitialized);
       
      // percorre todos codigos de servidores gerados
      for (var [key, code] of modifiedServerCode) {
        let outputFile = path.join(outputDir, item);
        outputFile = `./src-gen/start-${key}.js`;
        if (!fs.existsSync(outputFile)|| !filesInitialized.includes(outputFile)) {
          fs.writeFileSync(
            outputFile,
            generateInitialCode("server", key), // codigo inicial do arquivo de servidor
          );
          filesInitialized.push(outputFile);
        } 
        
        if (code !== null) {
          fs.appendFileSync(
            outputFile, 
            '\n'+beautify(code, {
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

      // gerador dos waitForCall 
      const WaitforCallGenerator = new WaitForCallGenerator();  
      const modifiedWaitForCall = WaitforCallGenerator.generateFunctions(tree, filesInitialized); 

      for (var [key, code] of modifiedWaitForCall) {
        let outputFile = path.join(outputDir, item);
        outputFile = `./src-gen/start-${key}.js`;
        if (!fs.existsSync(outputFile)|| !filesInitialized.includes(outputFile)) {
          fs.writeFileSync(
            outputFile,
          );
          filesInitialized.push(outputFile);
        } 
        
        // da append dos codigos gerados nos arquivos de servidores 
        if (code !== null) {
          fs.appendFileSync(
            outputFile, 
            '\n'+beautify(code, {
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
