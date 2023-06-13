#!/usr/bin/env node

import entrypoint from '../src/main.js';

const args = process.argv.slice(2);

const [ mode, target, inputDirRelative, outputDirRelative ] = args;

entrypoint(mode, target, inputDirRelative, outputDirRelative);