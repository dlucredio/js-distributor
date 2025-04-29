#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import gradient from 'gradient-string';
import entrypoint from '../src/main.js';

const colorGradient = gradient([
    '#714674',
    '#9F6976',
    '#CC8B79',
    '#FAAE7B',
    '#FFADAD'
]);

// Show header banner
console.log(colorGradient.multiline(`
::::::'##::'######:::::::::::'########::'####::'######::'########:'########::'####:'########::'##::::'##:'########::'#######::'########::
:::::: ##:'##... ##:::::::::: ##.... ##:. ##::'##... ##:... ##..:: ##.... ##:. ##:: ##.... ##: ##:::: ##:... ##..::'##.... ##: ##.... ##:
:::::: ##: ##:::..::::::::::: ##:::: ##:: ##:: ##:::..::::: ##:::: ##:::: ##:: ##:: ##:::: ##: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##:
:::::: ##:. ######::'#######: ##:::: ##:: ##::. ######::::: ##:::: ########::: ##:: ########:: ##:::: ##:::: ##:::: ##:::: ##: ########::
'##::: ##::..... ##:........: ##:::: ##:: ##:::..... ##:::: ##:::: ##.. ##:::: ##:: ##.... ##: ##:::: ##:::: ##:::: ##:::: ##: ##.. ##:::
 ##::: ##:'##::: ##:::::::::: ##:::: ##:: ##::'##::: ##:::: ##:::: ##::. ##::: ##:: ##:::: ##: ##:::: ##:::: ##:::: ##:::: ##: ##::. ##::
. ######::. ######::::::::::: ########::'####:. ######::::: ##:::: ##:::. ##:'####: ########::. #######::::: ##::::. #######:: ##:::. ##:
:......::::......::::::::::::........:::....:::......::::::..:::::..:::::..::....::........::::.......::::::..::::::.......:::..:::::..::
 `));

const program = new Command();

program
    .name('js-distributor')
    .description('Distributes JavaScript components across folders, either once or in watch mode.')
    .version('1.0.0');

program
    .option('-m, --mode <mode>', 'Mode to run in: "single" or "watch"', 'single')
    .option('-c, --configFile <path>', 'Path to config file', 'config.yml')
    .requiredOption('-i, --inputDir <path>', 'Input directory containing source files')
    .requiredOption('-o, --outputDir <path>', 'Directory where output will be written')
    .option('--cleanOutput', 'Whether to clean output before running', false)
    .option('--generateProjects', 'Generate project files for each output unit', false)
    .option('--generateDocker', 'Generate Docker files for the projects', false)
    .option('--rootDir', 'Root directory for the project', process.cwd(),false);

program.parse(process.argv);

const options = program.opts();

// Validate configFile exists
if (!fs.existsSync(options.configFile) || !fs.lstatSync(options.configFile).isFile()) {
    console.error(chalk.red(`❌ Config file "${options.configFile}" does not exist.`));
    process.exit(1);
}


// Validate inputDir exists
if (!fs.existsSync(options.inputDir) || !fs.lstatSync(options.inputDir).isDirectory()) {
    console.error(chalk.red(`❌ Input directory "${options.inputDir}" does not exist or is not a directory.`));
    process.exit(1);
}

// All validations passed, call the entrypoint
entrypoint(options.mode,
    options.configFile,
    options.inputDir,
    options.outputDir,
    options.cleanOutput,
    options.generateProjects,
    options.generateDocker,
    options.rootDir
);