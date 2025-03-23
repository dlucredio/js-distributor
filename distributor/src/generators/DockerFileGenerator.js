import fs from "fs";
import path from "path";

export default class DockerFileGenerator {
    constructor(outputDir, functionNames){
        this.outputDir = outputDir;
        this.functionNames = functionNames;
    }

    generateProject(name, itemPath, port){
        const projectPath = path.resolve(path.join(this.outputDir, name));
        
        fs.mkdirSync(projectPath, { recursive: true }, (err) => {console.error("Error creating project folder: ", err);});
        
        fs.copyFileSync(itemPath, path.resolve(path.join(projectPath, "start-" +name+".js")));
        
        //TODO: copy only the functions that are used by the server
        for(let func in this.functionNames){
            const funcPath = path.resolve(path.join(projectPath, "functions-" +func+".js"));
            fs.copyFileSync(this.functionNames[func], funcPath);
        }


        const dockerFile = this.writeDockerFile(port);
        fs.writeFileSync(path.resolve(path.join(projectPath, "Dockerfile")), dockerFile);

        const packageJson = this.writePackageJson(name);
        fs.writeFileSync(path.resolve(path.join(projectPath, "package.json")), packageJson);

    }

    writeDockerFile(port){
        //TODO: how to use correct versions ?
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
        // TODO: copy only the dependencies that are used by the server
        // TODO: copy the version
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