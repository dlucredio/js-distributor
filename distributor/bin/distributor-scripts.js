#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import gradient from 'gradient-string';
import entrypoint from '../src/main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));


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

console.log(`Version: ${pkg.version}`);

const program = new Command();

program
    .name('js-distributor')
    .description('Distributes JavaScript components across folders, either once or in watch mode.')
    .version(pkg.version);

program
    .option('-c, --configFile <path>', 'Path to config file', 'config.yml')

program.parse(process.argv);

const options = program.opts();

// Validate configFile exists
if (!fs.existsSync(options.configFile) || !fs.lstatSync(options.configFile).isFile()) {
    console.error(chalk.red(`❌ Config file "${options.configFile}" does not exist.`));
    process.exit(1);
}

entrypoint(options.configFile);