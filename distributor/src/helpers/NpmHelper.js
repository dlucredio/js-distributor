// External imports
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Internal imports
import { packageJsonTemplate } from '../templates/NpmPackageJson.js';
import config from '../config/Configuration.js';

async function initNodeProject(folder, serverInfo, remoteFunctions) {
    console.log(`Initializing node project in folder ${folder}`);
    const packageJsonContent = packageJsonTemplate(serverInfo).trim();
    const packageJsonFile = path.join(folder, "package.json");
    fs.writeFileSync(packageJsonFile, packageJsonContent);
    console.log(`Created file ${packageJsonFile}`);

    let command = "npm install";

    if (config.hasHttpFunctions(serverInfo)) {
        command += " express";
    }

    if (config.hasRabbitFunctions(serverInfo) || remoteFunctions.some(f => f.method === 'rabbit')) {
        command += " amqplib uuid";
    }

    // TODO: add rabbit dependency if needed

    console.log(`Executing command "${command}" on directory ${folder}`);

    const result = await new Promise((resolve, reject) => {
        exec(command, { cwd: folder }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject(stderr);
                return;
            }

            resolve(stdout);
        });
    });
    console.log(result);
    console.log(`Finished initializing project for server ${serverInfo.id}!`);

}

export default { initNodeProject };