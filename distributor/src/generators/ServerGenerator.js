import { StringBuilder, getFunctionToBeExposedExportedName } from "./GeneratorUtils.js";

function generateServerInitializationCode(serverInfo, functionsToBeExposedInServer) {
    const stringBuilder = new StringBuilder();
    stringBuilder.writeLine("// Code generated for server " + serverInfo.id);

    if (functionsToBeExposedInServer.length > 0) {
        const groupedByPath = {};

        for (const { functionName, path } of functionsToBeExposedInServer) {
            // Normalize path to unix-style
            const unixStylePath = path.replace(/\\/g, "/");

            if (!groupedByPath[unixStylePath]) {
                groupedByPath[unixStylePath] = [];
            }
            groupedByPath[unixStylePath].push(getFunctionToBeExposedExportedName(functionName) + " as " + functionName);
        }

        // Generate imports
        for (const [path, functions] of Object.entries(groupedByPath)) {
            const functionsList = functions.join(", ");
            stringBuilder.writeLine(`import { ${functionsList} } from "./${path}";`);
        }
    }
    return stringBuilder.toString();
}


export default {
    generateServerInitializationCode
}