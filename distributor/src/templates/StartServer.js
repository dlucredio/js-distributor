// Internal imports
import { StringBuilder } from "../helpers/GeneratorHelpers.js";
import config from "../config/Configuration.js";
import rabbitMQTemplates from "./RabbitMQ.js";

export const startServerTemplate = (serverInfo, functionsToBeExposedInServer) => `
${config.hasHttpFunctions(serverInfo) ? `
import express from 'express';
` : ``}

${config.hasRabbitFunctions(serverInfo) ? `
import amqp from 'amqplib';
` : ``}
    
${exposedFunctionImports(functionsToBeExposedInServer)}

${config.hasHttpFunctions(serverInfo) ? `
const app = express();
const port = ${serverInfo.http.port};
app.use(express.json());

// HTTP GET functions
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-get').map((f) => `
    app.get('/${f.functionName}', ${f.isAsync ? "async " : ""} (requestParameter, responseParameter) => {
        ${f.args.map(a => `const ${a} = requestParameter.query.${a};`).join("")}
        const executionResult = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        return responseParameter.json({ executionResult });
    });
`).join("")}

// HTTP POST functions
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-post').map((f) => `
    app.post('/${f.functionName}', ${f.isAsync ? "async " : ""} (requestParameter, responseParameter) => {
        ${f.args.map(a => `const ${a} = requestParameter.body.${a};`).join("")}
        const executionResult = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        return responseParameter.json({ executionResult });
    });
`).join("")}

app.listen(port, () => {
    console.log('Server running in port ' + port);
});
` : ``}

${config.hasRabbitFunctions(serverInfo) ? rabbitSetup(functionsToBeExposedInServer) : ``}

`;

export const startTestServerTemplate = (serverInfo, functionsToBeExposedInServer) => `
${config.hasHttpFunctions(serverInfo) ? `
import express from 'express';
` : ``}

${config.hasRabbitFunctions(serverInfo) ? `
import amqp from 'amqplib';
` : ``}

${`import request from 'supertest';`}
    
${exposedFunctionImports(functionsToBeExposedInServer)}

${config.hasHttpFunctions(serverInfo) ? `
const app = express();
const port = ${serverInfo.http.port};
app.use(express.json());

// HTTP GET functions
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-get').map((f) => `
    app.get('/${f.functionName}', ${f.isAsync ? "async " : ""} (requestParameter, responseParameter) => {
        ${f.args.map(a => `const ${a} = requestParameter.query.${a};`).join("")}
        const executionResult = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        return responseParameter.json({ executionResult });
    });
`).join("")}

// HTTP POST functions
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-post').map((f) => `
    app.post('/${f.functionName}', ${f.isAsync ? "async " : ""} (requestParameter, responseParameter) => {
        ${f.args.map(a => `const ${a} = requestParameter.body.${a};`).join("")}
        const executionResult = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        return responseParameter.json({ executionResult });
    });
`).join("")}

${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-get').map((f) => `
    
    export async function ${f.functionName}ApiTest(${f.args.map(a => `${a}`).join(",")}){
        return JSON.parse((await request(app).get(\`/${f.functionName}${f.args.length > 0 ? '?': '' }${f.args.map(a => `${a}=\$\{${a}\}`).join("&")}\`)).
        text).executionResult;
    }
    `).join("")
}


export default app;
` : ``}

${config.hasRabbitFunctions(serverInfo) ? rabbitSetup(functionsToBeExposedInServer) : ``}

`;

function rabbitSetup(functionsToBeExposedInServer){
    return `
    async function waitForCalls() {
        try {
            const rabbitConnectionURL = "amqp://${config.getRabbitConfig().url}:${config.getRabbitConfig().port}";
            const connection = await tryToConnectToRabbit(rabbitConnectionURL, ${config.getRabbitConfig().numConnectionAttempts}, ${config.getRabbitConfig().timeBetweenAttempts});
            console.log("Waiting for calls via RabbitMQ on port ${config.getRabbitConfig().port}");
            const channel = await connection.createChannel();

            // RabbitMQ consumers
            ${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'rabbit').map(rabbitMQTemplates.generateWaitForCalls).join("")}
        } catch(error) {
            console.log("Could not connect to RabbitMQ");
        }
    }

    async function tryToConnectToRabbit(rabbitConnectionURL, numConnectionAttempts, timeBetweenAttempts) {
        const maxRetries = numConnectionAttempts;
        let attempts = 0;

        while (attempts < maxRetries) {
            try {
                const connection = await amqp.connect(rabbitConnectionURL);
                console.log("Connection with RabbitMQ established");
                return connection;
            } catch(error) {
                attempts++;
                console.log("Error connecting to Rabbit service at "+rabbitConnectionURL);
                if (attempts < maxRetries) {
                    console.log('Retrying in ' + timeBetweenAttempts + ' seconds...');
                    await new Promise(resolve => setTimeout(resolve, timeBetweenAttempts * 1000));
                } else {
                    console.log('Max retries reached. Could not connect to Rabbit service.');
                    throw error;
                }
            }
        }
    }

    waitForCalls();
    `;
}

function exposedFunctionImports(functionsToBeExposedInServer) {
    const groupedByPath = {};

    for (const { functionName, exportedName, relativePath } of functionsToBeExposedInServer) {
        // Normalize path to unix-style
        const unixStylePath = relativePath.replace(/\\/g, "/");

        if (!groupedByPath[unixStylePath]) {
            groupedByPath[unixStylePath] = [];
        }
        groupedByPath[unixStylePath].push(exportedName + " as " + functionName);
    }

    const stringBuilder = new StringBuilder();

    // Generate imports for local exposed functions
    for (const [path, functions] of Object.entries(groupedByPath)) {
        const functionsList = functions.join(", ");
        stringBuilder.writeLine(`import { ${functionsList} } from "./${path}";`);
    }

    return stringBuilder.toString();
}