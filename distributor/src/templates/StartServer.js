// Internal imports
import { StringBuilder } from "../helpers/GeneratorHelpers.js";
import config from "../config/Configuration.js";

export const startServerTemplate = (serverInfo, functionsToBeExposedInServer) => `
${config.hasHttpFunctions(serverInfo) && `
import express from 'express';
`}

${exposedFunctionImports(functionsToBeExposedInServer)}

const app = express();
const port = ${serverInfo.port};
app.use(express.json());

// routes

// HTTP GET
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-get').map(exposedFunctionRoutesAsGet).join("")}

// HTTP POST
${functionsToBeExposedInServer.filter(f => f.functionInfo.method === 'http-post').map(exposedFunctionRoutesAsPost).join("")}


app.listen(port, () => {
    console.log('Server running in port ' + port);
});

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

const exposedFunctionRoutesAsGet = (ftbe) => `
app.get('/${ftbe.functionName}', ${ftbe.isAsync ? "async " : ""} (req, res) => {
    ${ftbe.args.map(a => `const ${a} = req.query.${a};`).join("")}
const result = ${ftbe.isAsync ? "await " : ""} ${ftbe.functionName}(${ftbe.args.join(", ")});
return res.json({ result });
});
`;

const exposedFunctionRoutesAsPost = (ftbe) => `
app.post('/${ftbe.functionName}', ${ftbe.isAsync ? "async " : ""} (req, res) => {
    ${ftbe.args.map(a => `const ${a} = req.body.${a};`).join("")}
const result = ${ftbe.isAsync ? "await " : ""} ${ftbe.functionName}(${ftbe.args.join(", ")});
return res.json({ result });
});
`;