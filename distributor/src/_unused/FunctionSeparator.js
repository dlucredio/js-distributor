import CopyPasteGenerator from "./CopyPasteGenerator.js";
import config from "../config/Configuration.js";
import { getFunctionToBeExposedExportedName } from "./GeneratorUtils.js";
import httpRequestTemplates from "./templates/HttpRequest.js";


export default class FunctionSeparator extends CopyPasteGenerator {
    constructor(parseTree) {
        super();
        this.parseTree = parseTree;
        this.isRemoteFunction = false;
    }

    separate(serverId) {
        this.functionsToBeExposed = [];
        this.serverId = serverId;
        this.stringBuilder.clear();
        this.visitProgram(this.parseTree);

        // Let's export the functions that must be exposed to other servers
        // We will use a new, generated name, because the original function
        // may or may not be exposed already
        if (this.functionsToBeExposed.length > 0) {
            this.stringBuilder.writeLine("export {");
            for (const ftbe of this.functionsToBeExposed) {
                this.stringBuilder.writeLine(ftbe.functionName + " as " + getFunctionToBeExposedExportedName(ftbe.functionName) + ",");
            }
            this.stringBuilder.writeLine("};");
        }
        return this.functionsToBeExposed;
    }

    getGeneratedCode() {
        return this.stringBuilder.toString();
    }

    isInThisServer(functionName) {
        // Let's find the server where this function will reside
        const server = config.getServerInfo(functionName);
        if (config.isReplicate(server)) { return true; }
        return server.id === this.serverId;
    }

    visitFunctionDeclaration(ctx) {
        const functionName = ctx.identifier().getText();
        if (!this.isInThisServer(functionName)) {
            this.generateRemoteFunction(ctx, functionName);
        } else {
            super.visitFunctionDeclaration(ctx);
            const serverInfo = config.getServerInfo(functionName);
            if (config.isReplicate(server)) { return; }
            const functionInfo = config.getFunctionInfo(serverInfo, functionName);
            const args = this.getArgs(ctx);
            const isAsync = ctx.Async() ? true : false;
            this.functionsToBeExposed.push({
                functionName: functionName,
                functionInfo: functionInfo,
                args: args,
                isAsync: isAsync,
            });
        }
    }

    generateRemoteFunction(ctx, functionName) {
        const serverInfo = config.getServerInfo(functionName);
        const functionInfo = config.getFunctionInfo(serverInfo, functionName);

        this.appendString("async function "); // Remote functions always use async
        if (
            ctx.children[1].getText().includes("*") ||
            ctx.children[2].getText().includes("*")
        )
            this.appendString("*");
        this.appendString(ctx.identifier().getText());
        this.appendString("(");
        if (ctx.formalParameterList())
            this.visitFormalParameterList(ctx.formalParameterList());
        this.appendString(") {");
        const args = this.getArgs(ctx);

        if (functionInfo.method === "http-get") {
            this.appendString(httpRequestTemplates.httpGetFetch(functionName, serverInfo.url, serverInfo.port, args));
        }

        this.appendString("}");
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