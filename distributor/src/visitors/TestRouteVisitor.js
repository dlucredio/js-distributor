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

    visitArgumentsExpression(ctx) {
        // Your logic here
        
        if(this.serverInfo.functions.some(obj => ctx.getText().includes(obj.declarationPattern))){
            console.log(ctx.getText());// replace this call
        }
        super.visitArgumentsExpression(ctx);
    }


}