import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import beautify from "js-beautify";
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";
import CopyPasteGenerator from "./generators/copypaste-generator.js";
import FunctionGenerator from "../src/generators/function-generator.js";
import NodeFunctionGenerator from "./generators/NodeFunctionGenerator.js";
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

function generateFunctionFiles(inputDir, outputDir, target) {
  console.log(`Generating function files from directory ${inputDir}`);

  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${inputDir}: ${err}`);
      return;
    }

    files.forEach((filename) => {
      const inputFile = path.join(inputDir, filename);

      try {
        const input = fs.readFileSync(inputFile, { encoding: "utf8" });
        const chars = new antlr4.InputStream(input);
        const lexer = new JavaScriptLexer(chars);
        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new JavaScriptParser(tokens);
        parser.buildParseTrees = true;
        const tree = parser.program();

        // Adiciona o código para gerar com NodeFunctionGenerator
        const nodeGenerator = new NodeFunctionGenerator();
        const modifiedNodeCode = nodeGenerator.generateFunctions(tree);

        modifiedNodeCode.forEach(function(code, i) {
          let outputFile = path.join(outputDir, filename);
          outputFile = `${outputFile.slice(0, -3)}-modifiedNode-${i}.js`;

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
        });

       // Gerador de servidor node
      const serverGenerator = new ServerGenerator();  
      const modifiedServerCode = serverGenerator.generateFunctions(tree); 
      modifiedServerCode.forEach(function(code, i) {
        let outputFile = path.join(outputDir, filename);
        outputFile = `${outputFile.slice(0, -3)}-modifiedNodeServer-${i}.js`;

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
      });







        // Adiciona o código para gerar com EventSourceGenerator

        // tree -> generateFunctions
        const EventSourceGen = new EventSourceGenerator();
        const modifiedEventSource = EventSourceGen.generateFunctions(tree);

        modifiedEventSource.forEach(function(code, i) {
          let outputFile = path.join(outputDir, filename);
          outputFile = `${outputFile.slice(0, -3)}-modifiedES-${i}.js`;

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
        });
      } catch (e) {
        console.log(e);
      }
    });
  });
}

