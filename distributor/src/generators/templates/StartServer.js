import { StringBuilder, getFunctionToBeExposedExportedName } from "../GeneratorUtils.js";

const startServerTemplate = (serverInfo, functionsToBeExposedInServer) => `
${hasHttpFunctions(functionsToBeExposedInServer) && `
import express from 'express';
`}

${exposedFunctionImports(functionsToBeExposedInServer)}

const app = express();
const port = ${serverInfo.port};
app.use(express.json());

// routes
${functionsToBeExposedInServer.map(exposedFunctionRoutes).join("")}

app.listen(port, () => {
    console.log('Server running in port ' + port);
});

`;

function hasHttpFunctions(functionsToBeExposedInServer) {
    return functionsToBeExposedInServer.some(
        f => f.functionInfo.method === 'http-get' ||
            f.functionInfo.method === 'http-post'
    );
}


function exposedFunctionImports(functionsToBeExposedInServer) {
    const groupedByPath = {};

    for (const { functionName, path } of functionsToBeExposedInServer) {
        // Normalize path to unix-style
        const unixStylePath = path.replace(/\\/g, "/");

        if (!groupedByPath[unixStylePath]) {
            groupedByPath[unixStylePath] = [];
        }
        groupedByPath[unixStylePath].push(getFunctionToBeExposedExportedName(functionName) + " as " + functionName);
    }

    const stringBuilder = new StringBuilder();

    // Generate imports for local exposed functions
    for (const [path, functions] of Object.entries(groupedByPath)) {
        const functionsList = functions.join(", ");
        stringBuilder.writeLine(`import { ${functionsList} } from "./${path}";`);
    }

    return stringBuilder.toString();
}

function exposedFunctionRoutes(ftbe) {
return `
app.get('/${ftbe.functionName}', async (req, res) => {
    ${ftbe.args.map(a => `const ${a} = req.query.${a};`).join("")}
const result = ${ftbe.isAsync ? "await " : ""} ${ftbe.functionName}(${ftbe.args.join(", ")});
return res.json({ result });
});
`;
}

export default {
    startServerTemplate
};