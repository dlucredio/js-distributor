import fs from "fs";
import path from "path";

export default class DockerGenerator {
    constructor(outputDir, functionNames){
        this.outputDir = outputDir;
        this.functionNames = functionNames;
    }

    generateProject(name, itemPath, port, dockerFilePath){
        const projectPath = path.resolve(path.join(this.outputDir, name));
        
        fs.mkdirSync(projectPath, { recursive: true }, (err) => {console.error("Error creating project folder: ", err);});
        
        fs.copyFileSync(itemPath, path.resolve(path.join(projectPath, "start-" +name+".js")));
        
        for(let func in this.functionNames){
            const funcPath = path.resolve(path.join(projectPath, "functions-" +func+".js"));
            fs.copyFileSync(this.functionNames[func], funcPath);
        }

        //TODO: dockerFileName will be used to build on the docker compose.
        const dockerFileName = this.writeDockerFile(port, dockerFilePath, projectPath);

        const packageJson = this.writePackageJson(name);
        fs.writeFileSync(path.resolve(path.join(projectPath, "package.json")), packageJson);

    }

    
    /**
     * Generates or copies a Dockerfile for a Node.js project.
     *
     * @param {number} port - The port number to expose in the Dockerfile.
     * @param {string} dockerFilePath - The path to an existing Dockerfile to copy. If not provided, a default Dockerfile will be generated.
     * @param {string} projectPath - The path to the project directory where the Dockerfile will be created or copied.
     * @returns {string} - The name of the Dockerfile created or copied.
     * @throws {Error} - Throws an error if the Dockerfile cannot be written or copied.
     */
    writeDockerFile(port, dockerFilePath, projectPath){
        if (dockerFilePath) {
            const dockerFileName = path.basename(dockerFilePath);
            const destinationPath = path.resolve(path.join(projectPath, dockerFileName));
            
            // TODO: Fix dockerfile src path resolution
            const resolvedDockerFilePath = path.resolve(dockerFilePath);
            console.log(resolvedDockerFilePath, destinationPath);
            fs.copyFileSync(resolvedDockerFilePath, destinationPath);
            return dockerFileName;
        }
        console.log("Please provide a valid dockerfile path in the config.yml file. Otherwise, the default dockerfile will be used.");
        let dockerFile = "FROM node:14-alpine\n"; //version?
        dockerFile += "WORKDIR /app\n"; 
        dockerFile += "COPY package*.json ./\n";
        dockerFile += "RUN npm install\n";
        dockerFile += "COPY . .\n"; //copy just the server
        dockerFile += `EXPOSE ${port}\n`;
        dockerFile += 'CMD ["npm", "start"]\n';
        fs.writeFileSync(path.resolve(path.join(projectPath, "Dockerfile")), dockerFile);
        return "Dockerfile";
    }

    getDependencies(){
        const packageJsonPath = path.resolve(path.join(process.cwd(), "package.json"));
        const packageJsonData = fs.readFileSync(packageJsonPath, "utf8")

        const packageJson = JSON.parse(packageJsonData);
        const dependencies = packageJson.dependencies;

        delete dependencies["distributor"];
        delete dependencies["antlr4"];
        return dependencies;
    }

    writePackageJson(name){
        const dependencies = JSON.stringify(this.getDependencies(), null, 8);
        const jsonStr = dependencies.replace(/\n\}$/, "\n    }");
        const packageJsonTemplate = `{
    "name": "ms-${name}",
    "version": "1.0.0",
    "description": "A simple Express application",
    "main": "start-${name}.js",
    "type": "module",
    "scripts": {
        "start": "node start-${name}.js",
        "dev": "nodemon start-${name}.js"
    },
    "dependencies": ${jsonStr},
    "keywords": [],
    "author": "",
    "license": "ISC"
}
        `;

        return packageJsonTemplate;

    }
}