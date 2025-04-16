// ANTLR code imports
import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";

// Internal imports
import config from '../config/Configuration.js';
import httpAPITemplates from '../templates/HttpAPI.js'
import ast from '../transformations/ASTModifications.js';

export class ReplaceRemoteFunctionsVisitor extends JavaScriptParserVisitor {
    constructor(serverInfo, relativePath) {
        super();
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.remoteFunctions = [];
        this.exposedFunctions = [];
    }

    visitProgram(ctx) {
        super.visitProgram(ctx);

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
                const newBody = "{ console.log('not implemented'); }";
                ast.replaceFunctionBody(ctx, newBody);
            }

            // Since all remote code uses await, we must make the function async
            ast.addAsyncIfNecessary(ctx);

            // Finally, we mark this function as remote to propagate the async
            this.remoteFunctions.push({
                callPatterns: functionInfo.callPatterns,
                serverInfo: this.serverInfo,
                relativePath: this.relativePath,
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
}