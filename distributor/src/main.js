import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import beautify from "js-beautify";
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import CopyPasteGenerator from "./generators/copypaste-generator.js";
import FunctionGenerator from "../src/generators/function-generator.js";

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
    generateFunctionFile(target, inputDirRelative, outputDir);
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
          `File ${filename} has changed (${event}). Generating code and function file again...`
        );
        generateCodeDir(target, inputDirRelative, outputDir);
        generateFunctionFile(target, inputDirRelative, outputDir);
      }
    });
  } else {
    console.log("Wrong usage! Learn!");
  }
}

function generateCodeDir(target, inputDir, outputDir) {
  console.log(`Scanning directory ${inputDir}`);

  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${inputDir}: ${err}`);
      return;
    }

    files.forEach((filename) => {
      const inputFile = path.join(inputDir, filename);
      const outputFile = path.join(outputDir, filename);

      generateCode(target, inputFile, outputFile);
    });
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

/* 

A função generateFunctionFile é responsável por ler arquivos de um diretório de 
entrada, analisá-los com o analisador léxico e sintático 
e extrair definições de funções desses arquivos. 

*/

function generateFunctionFile(target, inputDir, outputDir) {
  console.log(`Generating function file from directory ${inputDir}`);
  // lista para armazenar funções
  const functionDefinitions = [];

  // Lê todos os arquivos no diretório de entrada -- ARRUMAR
  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${inputDir}: ${err}`);
      return;
    }

    // Itera sobre cada arquivo no diretório -- ARRUMAR (Nao precisa ser todos arquivos)
    files.forEach((filename) => {
      const inputFile = path.join(inputDir, filename);

      try {
        // Lê o conteúdo do arquivo de entrada
        const input = fs.readFileSync(inputFile, { encoding: "utf8" });
        const chars = new antlr4.InputStream(input);

        // analisador léxico usando o fluxo de caracteres
        const lexer = new JavaScriptLexer(chars);

        // Cria um fluxo de tokens usando o analisador léxico
        const tokens = new antlr4.CommonTokenStream(lexer);

        // Cria um analisador sintático JavaScriptParser usando o fluxo de tokens
        const parser = new JavaScriptParser(tokens);

        //  construção de árvores de análise
        parser.buildParseTrees = true;

        // Faz a análise do programa no arquivo
        const tree = parser.program();

        // Usa a classe FunctionGenerator para extrair as definições de função do arquivo
        const functionGenerator = new FunctionGenerator();
        const generatedCode = functionGenerator.generateFunctions(tree);

        // gerar arquivo de funcao gerada 
        generatedCode.forEach(function(code, i) {
          let outputFile = path.join(outputDir, filename);
          outputFile = `${outputFile.slice(0, -3)}-${i}.js`;

          if (fs.existsSync(outputFile)) {
            fs.rmSync(outputFile);
          }
      
          if (code !== null) {
            fs.writeFileSync(
              outputFile,
              beautify(code, {
                indent_size: 4,
                space_in_empty_paren: true,
              })
            );
          }
        })

        // // Adiciona as definições de função extraídas à lista
        // functionDefinitions.push(functionCode);

      } catch (e) {
        console.log(e);
      }
    });

    // // Caminho completo para o arquivo de saída
    // const outputFile = path.join(outputDir, "functions.js");

    // // Concatena todas as definições de função em um único código
    // const beautifiedCode = beautify(functionDefinitions.join("\n"), {
    //   indent_size: 4,
    //   space_in_empty_paren: true,
    // });

    // // Escreve o código no arquivo de saída
    // fs.writeFileSync(outputFile, beautifiedCode, { encoding: "utf8" });
  });
}

