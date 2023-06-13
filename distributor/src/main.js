import antlr4 from "antlr4";
import path from "path";
import fs from "fs";
import glob from "glob";
import sleep from "sleep";
import beautify from "js-beautify";
import CopyPasteGenerator from "./generators/copypaste-generator.js";
import { flattenGeneratedCode } from "./generators/generator-utils.js";
import JavaScriptLexer from "./antlr4/JavaScriptLexer.js";
import JavaScriptParser from "./antlr4/JavaScriptParser.js";

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
  } else if (mode === "watch") {
    let fsWait = false;

    console.log(`Watching ${inputDir} for changes...`);

    fs.watch(inputDir, (event, filename) => {
      if (filename) {
        if (fsWait) return;
        fsWait = true;
        fsWait = setTimeout(() => {
          fsWait = false;
        }, 500);
        console.log(
          `File ${filename} has changed (${event}). Generating code again...`
        );
        sleep.msleep(100);
        generateCodeDir(target, inputDirRelative, outputDir);
      }
    });
  } else {
    console.log("Wrong usage! Learn!");
  }
}

function generateCodeDir(target, inputDir, outputDir) {
  console.log(`Scanning directory ${inputDir}`);

  glob(`${inputDir}/**/*.js`, function (er, files) {
    files.forEach((inputFile) => {
      const outputFile = path.join(outputDir, path.basename(inputFile));
      generateCode(target, inputFile, outputFile);
    });
  });
}

function generateCode(target, inputFile, outputFile) {
  try {
    console.log(`generating ${inputFile} -> ${outputFile}`);

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
