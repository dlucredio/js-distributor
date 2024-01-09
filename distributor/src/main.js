import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import beautify from "js-beautify";
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import CopyPasteGenerator from "./generators/copypaste-generator.js";
import FunctionGenerator from "./generators/FunctionGenerator.js";
import EventSourceGenerator from "./generators/EventSourceGenerator.js";
import ServerGenerator from "./generators/ServerGenerator.js";

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
    generateCodeDir(target, inputDirRelative, outputDir);
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
        generateCodeDir(target, inputDirRelative, outputDir);
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


// retorna codigo inicial (importacoes, inicializacao servidor) para cada tipo de arquivo
function generateInitialCode(typeOfCode, serverName) {
  if (typeOfCode === 'function'){
    return "import fetch from 'node-fetch';"
  } else if (typeOfCode === 'server') {
    let code = "import express from 'express';\n";
    code += "const app = express();\n";
    code += `const port = ${getPortOfServer(serverName)};\n`; 
    code += `app.use(express.json());\n`;
    code += `app.listen(port, () => {\n`;
    code += `  console.log('Servidor rodando na porta ' + port);\n`;
    code += `});`;

    return code;
  }
};

// auxiliar para obter porta do servidor passado
function getPortOfServer(serverName) {
  const yamlPath = './config4.yml';
  const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
  let serverInfo = config.servers.find((server) => server.id === serverName);
  return serverInfo.port;
}

function generateFunctionFiles(inputDir, outputDir, target, filesInicialized=[]) {
  let items = fs.readdirSync(inputDir);
  for (let item of items) {
    const itemPath = path.join(inputDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      filesInicialized = generateFunctionFiles(itemPath, outputDir, target, filesInicialized)
    } else {
      try {
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
          outputFile = `./src-gen/modifiedNode-${key}.js`;
          
          // se arquivo nao existe ou execucao esta sendo feito novamente, cria outro
          if (!fs.existsSync(outputFile) || !filesInicialized.includes(outputFile)) {
            fs.writeFileSync(
              outputFile,
              generateInitialCode("function"),
            );
            filesInicialized.push(outputFile);
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


      // Gerador de servidor node
      // serversInitialized = [];
      
      const serverGenerator = new ServerGenerator();  
      const modifiedServerCode = serverGenerator.generateFunctions(tree, filesInicialized);
      // necessario passar codigo gerado na iteracao anterior para gerador
      // modifiedServerCode = serverGenerator.generateFunctions(tree, modifiedServerCode); 
      // percorre todos codigos de servidores gerados
      for (var [key, code] of modifiedServerCode) {
        let outputFile = path.join(outputDir, item);
        outputFile = `./src-gen/modifiedNodeServer-${key}.js`;
        if (!fs.existsSync(outputFile)|| !filesInicialized.includes(outputFile)) {
          fs.writeFileSync(
            outputFile,
            generateInitialCode("server", key),
          );
          filesInicialized.push(outputFile);
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


        // Adiciona o código para gerar com EventSourceGenerator

        // tree -> generateFunctions
        // const EventSourceGen = new EventSourceGenerator();
        // const modifiedEventSource = EventSourceGen.generateFunctions(tree);

        // modifiedEventSource.forEach(function(code, i) {
        //   let outputFile = path.join(outputDir, filename);
        //   outputFile = `${outputFile.slice(0, -3)}-modifiedES-${i}.js`;

        //   if (fs.existsSync(outputFile)) {
        //     fs.rmSync(outputFile);
        //   }

        //   if (code !== null) {
        //     fs.writeFileSync(
        //       outputFile,
        //       beautify(code, {
        //         indent_size: 4,
        //         space_in_empty_paren: true,
        //       })
        //     );
        //   }
        // });
      } catch (e) {
        console.log(e);
      }
    }
  }
  return filesInicialized;
}
