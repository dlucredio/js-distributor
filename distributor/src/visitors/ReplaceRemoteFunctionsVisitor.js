// ANTLR code imports
import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";

// Internal imports
import config from '../config/Configuration.js';
import httpAPITemplates from '../templates/HttpAPI.js';
import rabbitMQTemplates from '../templates/RabbitMQ.js';
import ast from '../transformations/ASTModifications.js';

import * as parser from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
const babelTraverse = traverse.default ?? traverse;

export class ReplaceRemoteFunctionsVisitor extends JavaScriptParserVisitor {
    constructor(serverInfo, relativePath, babelTree) {
        super();
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.babelTree = babelTree;
        this.remoteFunctions = [];
        this.exposedFunctions = [];
        this.consumesRabbitFunctions = false;
    }

    visitProgram(ctx) {
        super.visitProgram(ctx);

        babelTraverse(this.babelTree, {
            FunctionDeclaration(path) {
                const functionName = path.node.id?.name;
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
                    this.replaceFunctionBody(path, newBody);
                } else if(functionInfo.method === "http-post") {
                    const newBody = httpAPITemplates.httpPostFetch(functionName, serverInfo.http.url, serverInfo.http.port, args);
                    this.replaceFunctionBody(path, newBody);
                } else if(functionInfo.method === "rabbit") {
                    const newBody = rabbitMQTemplates.rabbitProducerCode(functionName, functionInfo, args);
                    this.replaceFunctionBody(path, newBody);
                    this.consumesRabbitFunctions = true;
                }
            }
        })

        // Let's add the required imports
        if(this.consumesRabbitFunctions) {
            const importStatements = rabbitMQTemplates.importStatements();
            for(const is of importStatements) {
                ast.addImportStatementNode(ctx, is);
            }
        }

        // Let's export the functions that must be exposed to other servers
        // We will use a new, generated name, because the original function
        // may or may not be exposed already
        if (this.exposedFunctions.length > 0) {
            const exports = [];
            for (const ef of this.exposedFunctions) {
                exports.push(ef.functionName + " as " + ef.exportedName);
            }
            const exportStatement = "export { " + exports.join(", ") + " };";
            ast.addExportStatementNode(ctx, exportStatement);            
        }
    }

    getRemoteFunctions() {
        return this.remoteFunctions;
    }

    getExposedFunctions() {
        return this.exposedFunctions;
    }

    isInThisServer(functionName) {
        const server = config.getServerInfo(functionName);
        if (!server) { return true; } // Functions not defined in config.yml are replicated to every server
        return server.id === this.serverInfo.id;
    }

    visitFunctionDeclaration(ctx) {
        const functionName = ctx.identifier().getText();
        if (!this.isInThisServer(functionName)) {
            // Let's transform this function into a remote function
            const args = this.getArgs(ctx);

            // The following two calls will never return null, as we already
            // confirmed that the function is in this server
            const serverInfo = config.getServerInfo(functionName);
            const functionInfo = config.getFunctionInfo(serverInfo, functionName);

            // Let's call the templates to fill with the proper remote bodies
            if (functionInfo.method === "http-get") {
                const newBody = httpAPITemplates.httpGetFetch(functionName, serverInfo.http.url, serverInfo.http.port, args);
                ast.replaceFunctionBody(ctx, newBody);
            } else if(functionInfo.method === "http-post") {
                const newBody = httpAPITemplates.httpPostFetch(functionName, serverInfo.http.url, serverInfo.http.port, args);
                ast.replaceFunctionBody(ctx, newBody);
            } else if(functionInfo.method === "rabbit") {
                const newBody = rabbitMQTemplates.rabbitProducerCode(functionName, functionInfo, args);
                ast.replaceFunctionBody(ctx, newBody);
                this.consumesRabbitFunctions = true;
            }

            // Since all remote code uses await, we must make the function async
            ast.addAsyncIfNecessary(ctx);

            // Finally, we mark this function as remote to propagate the async
            this.remoteFunctions.push({
                callPatterns: functionInfo.callPatterns,
                serverInfo: this.serverInfo,
                relativePath: this.relativePath,
                method: functionInfo.method
            });
        } else {
            // Not a remote function. Let's check if it must be expoed
            const functionInfo = config.getFunctionInfo(this.serverInfo, functionName);

            // If functionInfo is null, this means this function is replicated to
            // every server and does not need to be exposed. Otherwise we store it
            // to expose
            if (functionInfo) {
                const args = this.getArgs(ctx);

                this.exposedFunctions.push({
                    functionName: functionName,
                    exportedName: functionName+"_localRef",
                    functionInfo: functionInfo,
                    serverInfo: this.serverInfo,
                    relativePath: this.relativePath,
                    args: args,
                    isAsync: ctx.Async() ? true : false
                });
            }
        }
    }

    getArgs(ctx) {
        const args = [];
        if (ctx.formalParameterList()?.formalParameterArg()) {
            for (let i = 0; i < ctx.formalParameterList().formalParameterArg().length; i++) {
                args.push(ctx.formalParameterList().formalParameterArg(i).assignable().getText());
            }
            if (ctx.formalParameterList().lastFormalParameterArg()) {
                args.push(ctx.formalParameterList().formalParameterArg(i).assignable().getText());
            }
        }
        return args;
    }

    replaceFunctionBody(path, rawJsCode) {
        // Parse the raw code into an AST
        const bodyAst = parser.parse(rawJsCode, {
            sourceType: "module"        
        });

        const newStatements = bodyAst.program.body;

        if (!t.isBlockStatement(path.node.body)) {
            path.node.body = t.blockStatement([]);
        }

        path.get("body").replaceWith(t.blockStatement(newStatements));
    }
}