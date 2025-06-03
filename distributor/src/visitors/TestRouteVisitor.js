// ANTLR code imports
import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";

// Internal imports
import config from '../config/Configuration.js';
import helpers from '../helpers/GenericHelpers.js';
import ast from '../transformations/ASTModifications.js';

export class TestRouteVisitor extends JavaScriptParserVisitor {
    constructor(serverInfo, relativePath, tree) {
        super();
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.tree = { ...tree };
    }

    replaceTestApiCall(){
        this.visitProgram(this.tree);
        return this.tree;
    }

   

    visitArrowFunctionBody(ctx) {
        super.visitArrowFunctionBody(ctx);
    }

    visitFunctionBody(ctx){
        //console.log(ctx.getText())
        super.visitFunctionBody(ctx);
    }

}