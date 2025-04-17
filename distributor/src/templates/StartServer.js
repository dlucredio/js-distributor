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
    app.get('/${f.functionName}', ${f.isAsync ? "async " : ""} (req, res) => {
        ${f.args.map(a => `const ${a} = req.query.${a};`).join("")}
        const result = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        return res.json({ result });
    });
`).join("")}

// HTTP POST functions
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-post').map((f) => `
    app.post('/${f.functionName}', ${f.isAsync ? "async " : ""} (req, res) => {
        ${f.args.map(a => `const ${a} = req.body.${a};`).join("")}
        const result = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        return res.json({ result });
    });
`).join("")}

app.listen(port, () => {
    console.log('Server running in port ' + port);
});
` : ``}

${config.hasRabbitFunctions(serverInfo) ? `
async function waitForCalls() {
    const connection = await amqp.connect("amqp://${config.getRabbitConfig().url}:${config.getRabbitConfig().port}");
    console.log("Waiting for calls via RabbitMQ on port ${config.getRabbitConfig().port}");
    const channel = await connection.createChannel();

    // RabbitMQ consumers
    ${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'rabbit').map(rabbitMQTemplates.generateWaitForCalls).join("")}
}

waitForCalls();
` : ``}

`;


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