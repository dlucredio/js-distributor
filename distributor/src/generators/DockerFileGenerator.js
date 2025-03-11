import fs from "fs";
import path from "path";

export default class DockerFileGenerator {
    constructor(outputDir, functionNames){
        this.outputDir = outputDir;
        this.functionNames = functionNames;
    }

    generateProject(name, itemPath, port){
        console.log("Generating project: ", name);
        console.log("Item path: ", itemPath);
        const projectPath = path.resolve(path.join(this.outputDir, name));
        
        console.log("Project path: ", projectPath); 
        
        //create folder for the server
        fs.mkdirSync(projectPath, { recursive: true }, (err) => {console.error("Error creating project folder: ", err);});
        
        //Copy server file to the output folder on the server subfolder
        fs.copyFileSync(itemPath, path.resolve(path.join(projectPath, "start-" +name+".js")));
        
        //copy all function files...
        for(let func in this.functionNames){
            const funcPath = path.resolve(path.join(projectPath, "functions-" +func+".js"));
            fs.copyFileSync(this.functionNames[func], funcPath);
        }

        //Create docker file for this server
            // export port defined on config.yml
        const dockerFile = this.writeDockerFile(port);
        fs.writeFileSync(path.resolve(path.join(projectPath, "Dockerfile")), dockerFile);


        // Create package.json
        const packageJson = this.writePackageJson(name);
        fs.writeFileSync(path.resolve(path.join(projectPath, "package.json")), packageJson);
        
        // Create start.sh (?)




    }

    writeDockerFile(port){
        let dockerFile = "FROM node:14-alpine\n"; //version?
        dockerFile += "WORKDIR /app\n"; 
        dockerFile += "COPY package*.json ./\n";
        dockerFile += "RUN npm install\n";
        dockerFile += "COPY . .\n"; //copy just the server
        dockerFile += `EXPOSE ${port}\n`;
        dockerFile += 'CMD ["npm", "start"]\n';
        return dockerFile;
    }

    writePackageJson(name){
        //copy project dependencys...
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
    "dependencies": {
        "express": "^4.18.2",
        "amqplib": "^0.10.3",
        "node-fetch": "^3.3.2",
        "pg": "^8.11.5",
        "uuid": "^9.0.1"
    },
    "devDependencies": {
        "nodemon": "^2.0.15"
    },
    "keywords": [],
    "author": "",
    "license": "ISC"
}
        `;

        return packageJsonTemplate;

    }
}