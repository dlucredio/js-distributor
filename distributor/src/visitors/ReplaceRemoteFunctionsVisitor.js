// Babel imports
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
const babelTraverse = traverse.default ?? traverse;

// Internal imports
import config from '../config/Configuration.js';
import httpAPITemplates from '../templates/HttpAPI.js';
import rabbitMQTemplates from '../templates/RabbitMQ.js';



export class ReplaceRemoteFunctionsVisitor {
    constructor(serverInfo, relativePath) {
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.babelRemoteFunctions = [];
        this.babelExposedFunctions = [];
        this.consumesRabbitFunctions = false;
    }

    visitFunctionDeclarationWrapper(babelTree){
        const selfReference = this;
        babelTraverse(babelTree, {
            FunctionDeclaration(path) {
                const functionName = path.node.id?.name;
                if (!selfReference.isInThisServer(functionName)) {
                    const paramsNode = path.node.params;
                    const args = paramsNode.map(param => { //getParams.
                        if (param.type === "Identifier") return param.name;
                        if (param.type === "AssignmentPattern") return param.left.name; // default values
                        if (param.type === "RestElement") return `...${param.argument.name}`; // rest params
                        return;
                    });

                    const serverInfo = config.getServerInfo(functionName);
                    const functionInfo = config.getFunctionInfo(serverInfo, functionName);
                    console.log("Found function:", functionName);

                    if (functionInfo.method === "http-get") {
                        const newBody = httpAPITemplates.httpGetFetch(functionName, serverInfo.http.url, serverInfo.http.port, args);
                        selfReference.replaceFunctionBody(path, newBody);
                    } else if(functionInfo.method === "http-post") {
                        const newBody = httpAPITemplates.httpPostFetch(functionName, serverInfo.http.url, serverInfo.http.port, args);
                        selfReference.replaceFunctionBody(path, newBody);
                    } else if(functionInfo.method === "rabbit") {
                        const newBody = rabbitMQTemplates.rabbitProducerCode(functionName, functionInfo, args);
                        selfReference.replaceFunctionBody(path, newBody);
                        selfReference.consumesRabbitFunctions = true;
                    }

                     selfReference.babelRemoteFunctions.push({
                        callPatterns: functionInfo.callPatterns,
                        serverInfo: selfReference.serverInfo,
                        relativePath: selfReference.relativePath,
                        method: functionInfo.method
                    });
                }else {
                    // Not a remote function. Let's check if it must be expoed
                    const functionInfo = config.getFunctionInfo(selfReference.serverInfo, functionName);

                    // If functionInfo is null, this means this function is replicated to
                    // every server and does not need to be exposed. Otherwise we store it
                    // to expose
                    if (functionInfo) {
                        const paramsNode = path.node.params;
                        const args = paramsNode.map(param => { //getParams.
                            if (param.type === "Identifier") return param.name;
                            if (param.type === "AssignmentPattern") return param.left.name; // default values
                            if (param.type === "RestElement") return `...${param.argument.name}`; // rest params
                            return;
                        });

                        selfReference.babelExposedFunctions.push({
                            functionName: functionName,
                            exportedName: functionName+"_localRef",
                            functionInfo: functionInfo,
                            serverInfo: selfReference.serverInfo,
                            relativePath: selfReference.relativePath,
                            args: args,
                            isAsync: path.node.async ? true : false
                        });
                    }
                }
            }
        })

        // Let's add the required imports
        if(this.consumesRabbitFunctions) {
            const importStatements = rabbitMQTemplates.importStatements();
            for(const is of importStatements) {
                // TODO: Extract this section to avoid code duplication
                //Babel 
                const node = parser.parse(is, { sourceType: "module" }).program.body[0];
                babelTree.program.body.unshift(node);
            }
        }

        // Let's export the functions that must be exposed to other servers
        // We will use a new, generated name, because the original function
        // may or may not be exposed already
        if (this.babelExposedFunctions.length > 0) {
            const exports = [];
            for (const ef of this.babelExposedFunctions) {
                exports.push(ef.functionName + " as " + ef.exportedName);
            }
            const exportStatement = "export { " + exports.join(", ") + " };";

            // TODO: Extract this section to avoid code duplication
            // Babel
            const node = parser.parse(exportStatement, { sourceType: "module", errorRecovery: true }).program.body[0]; // error covery is neecessary, since the function to export is not present defined on the `exportstatement`
            babelTree.program.body.push(node);            
        }
    }

    getRemoteFunctions() {
        return this.babelRemoteFunctions;
    }

    getExposedFunctions() {
        return this.babelExposedFunctions;
    }

    isInThisServer(functionName) {
        const server = config.getServerInfo(functionName);
        if (!server) { return true; } // Functions not defined in config.yml are replicated to every server
        return server.id === this.serverInfo.id;
    }

    replaceFunctionBody(path, rawJsCode) {
        // Parse the raw code into an AST
        const bodyAst = parser.parse(rawJsCode, {
            sourceType: "module",
            allowReturnOutsideFunction: true,        
        }); // the code been returned is double {}, must get the parsed child or other way to replace the body's content

        const newStatements = bodyAst.program.body;

        if (!t.isBlockStatement(path.node.body)) {
            path.node.body = t.blockStatement([]);
        }

        path.node.async = true;

        path.get("body").replaceWith(t.blockStatement(newStatements));
    }
}