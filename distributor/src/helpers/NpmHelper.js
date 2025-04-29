// External imports
import fs from "fs";
import path from "path";
import { exec } from "child_process";

// Internal imports
import args from "../config/Args.js";
import { packageJsonTemplate } from "../templates/NpmPackageJson.js";
import config from "../config/Configuration.js";

async function initNodeProject(folder, serverInfo, remoteFunctions) {
  console.log(`Initializing node project in folder ${folder}`);
  let packageJsonContent = packageJsonTemplate(serverInfo).trim();
  const packageJsonFile = path.join(folder, "package.json");
  // Ensure the package.json has a dependencies section
  let packageJson = JSON.parse(packageJsonContent);
  if (!packageJson.dependencies)
    packageJson.dependencies = getDependencies(serverInfo);

  packageJsonContent = JSON.stringify(packageJson, null, 2);
  fs.writeFileSync(packageJsonFile, packageJsonContent);
  console.log(`Created file ${packageJsonFile}`);

  await installDependency(serverInfo);

  console.log(`Finished initializing project for server ${serverInfo.id}!`);
}

function getDependencies(serverInfo) {
  let dependencies;
  // find package.json file
  // If the command is executed from the root of the project, only need the cwd.
  let rootDir = args.getRootDir();
  const packageJsonPath = path.join(rootDir, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    if (packageJson && packageJson.dependencies) {
      dependencies = packageJson.dependencies;
    }
  } else {
    throw new Error(
      "Could not find package.json. See if rootDir is configurated."
    );
  }
  if (!dependencies) {
    // If the package.json file does not exist, create a new one with the default dependencies
    // Or just throw an error ?
  }
  console.log("Package.json found");

  // remove unecessary dependencies
  delete dependencies["distributor"];

  return dependencies;
}

async function installDependency(serverInfo, folder) {
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
  } finally {
    console.log(result);
  }
}

export default { initNodeProject };
