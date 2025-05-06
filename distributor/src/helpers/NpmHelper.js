// External imports
import fs from "fs";
import path from "path";
import { exec } from "child_process";

// Internal imports
import { packageJsonTemplate } from "../templates/NpmPackageJson.js";
import config from "../config/Configuration.js";

async function initNodeProject(folder, serverInfo, remoteFunctions) {
  console.log(`Initializing node project in folder ${folder}`);
  let packageJsonContent = packageJsonTemplate(serverInfo).trim();
  const packageJsonFile = path.join(folder, "package.json");
  let packageJson = JSON.parse(packageJsonContent);

  packageJsonContent = JSON.stringify(packageJson, null, 2);
  fs.writeFileSync(packageJsonFile, packageJsonContent);
  console.log(`Created file ${packageJsonFile}`);

  await installDependency(serverInfo, folder, remoteFunctions);

  console.log(`Finished initializing project for server ${serverInfo.id}!`);
}

async function installDependency(serverInfo, folder, remoteFunctions) {
  let command = "npm install";

  if (config.hasHttpFunctions(serverInfo)) {
    command += " express";
  }

  if (
    config.hasRabbitFunctions(serverInfo) ||
    remoteFunctions.some((f) => f.method === "rabbit")
  ) {
    command += " amqplib uuid";
  }
  console.log(`Executing command "${command}" on directory ${folder}`);
  let result;
  try {
    result = await new Promise((resolve, reject) => {
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
  } catch (error) {
    console.error(`Error executing command "${command}": ${error}`);
    result = error;
  } finally {
    return result;
  }
}

export default { initNodeProject };
