#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import entrypoint from '../src/main.js';

const args = process.argv.slice(2);

const [mode, configFile, inputDirRelative, outputDirRelative] = args;

function showUsageAndExit() {
    console.error(`
Usage:
  js-distributor-scripts <mode> <configFile> <inputDir> <outputDir>

Arguments:
  mode           "single" or "watch"
  configFile     Path to existing config file
  inputDir       Path to existing input directory
  outputDir      Path to output directory
`);
    process.exit(1);
}

// Validate mode
if (mode !== 'single' && mode !== 'watch') {
    console.error(`Invalid mode: "${mode}". Expected "single" or "watch".`);
    showUsageAndExit();
}

// Validate configFile exists and is a file
if (!configFile || !fs.existsSync(configFile) || !fs.statSync(configFile).isFile()) {
    console.error(`Invalid config file: "${configFile}" does not exist or is not a file.`);
    showUsageAndExit();
}

// Validate inputDirRelative exists and is a directory
if (!inputDirRelative || !fs.existsSync(inputDirRelative) || !fs.statSync(inputDirRelative).isDirectory()) {
    console.error(`Invalid input directory: "${inputDirRelative}" does not exist or is not a directory.`);
    showUsageAndExit();
}

// Validate outputDirRelative is specified
if (!outputDirRelative) {
    console.error(`Missing output directory.`);
    showUsageAndExit();
}

// All validations passed, call the entrypoint
entrypoint(mode, configFile, inputDirRelative, outputDirRelative);