import beautify from "js-beautify";

import CopyPasteGenerator from "./CopyPasteGenerator.js";
import config from "../config/Configuration.js";
import httpApiGenerator from "./HttpApiGenerator.js";


export default class FunctionSeparator extends CopyPasteGenerator {
    constructor(parseTree) {
        super();
        this.parseTree = parseTree;
        this.isRemoteFunction = false;
    }

    separate(serverId) {
        this.serverId = serverId;
        this.stringBuilder.clear();
        this.visitProgram(this.parseTree);
    }

    getGeneratedCode() {
        const rawCode = this.stringBuilder.toString();
        const beautifiedCode = beautify(rawCode, {
            indent_size: 4,
            space_in_empty_paren: true,
        });
        return beautifiedCode;
    }

    isInThisServer(functionName) {
        // Let's find the server where this function will reside
        const server = config.getServerInfo(functionName);
        return server.id === this.serverId;
    }

    visitFunctionDeclaration(ctx) {
        const functionName = ctx.identifier().getText();
        if (!this.isInThisServer(functionName)) {
            this.generateRemoteFunction(ctx, functionName);
        } else {
            super.visitFunctionDeclaration(ctx);
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
        const requestCode = httpApiGenerator.generateHttpRequestCode(functionName, serverInfo, functionInfo, args);
        this.appendString(requestCode);
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