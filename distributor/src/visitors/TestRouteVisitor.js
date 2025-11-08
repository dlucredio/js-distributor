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
        this.functionPatterns = [] // i need functionName -> parameters

        this.serverInfo.functions.forEach(element => {
            element.callPatterns.forEach(e => {
                this.functionPatterns.push({ [e] : element.method})
            })
        });
    }

    replaceTestApiCall(){
        this.visitProgram(this.tree);
        return this.tree;
    }

    isReplaceable(text){
        for(let i = 0; i< this.functionPatterns.length; i++){
            const [[key, ]] = Object.entries(this.functionPatterns[i]);
            if(text.includes(key)){
                return i
            }
        }
        return -1
    }

    replaceTestCall(ctx){
        if(ctx == null) return
        let text = Array.isArray(ctx) ? ctx[0].getText() : ctx.getText();

        const functionIndex = this.isReplaceable(text)
        if(functionIndex >=0 ){
            console.log("CTX - " + this.serverInfo.id + " - " + this.relativePath + " ------- " + text)
        }
        
    }

    impr(ctx){
        let text = ctx.getText();
        const functionIndex = this.isReplaceable(text);
        if(functionIndex >= 0){//check if function is defined on this server.
            const functionName = Object.keys(this.functionPatterns[functionIndex])[0];
            ast.replaceImportCall(ctx, functionName,functionName+"ApiTest", "#root/start.js");
        }

        console.log("imports: " + ctx.getText())
    }

    visitImportStatement(ctx){
        this.impr(ctx)
        super.visitImportStatement(ctx);
    }
}

// Problems: 
/*
    gerar funções locais get pro teste FEITO
    gerar fuções locais post pro teste  FEITO
        ~instalar dependencia supertest~
        ~importar supertest~ 
    trocar na mão chamada nos testes (TESTADO COM GET, OK), (TESTADO COM POST, OK)
        Precisei importar a função do start.js (problematico...?)
        adicionar async/await nos testes. (testar se fixAsync cobre esses casos)
    // no import trocar funcApiTest por funcApiTest as func ... start.js. Remover import de func...
*/