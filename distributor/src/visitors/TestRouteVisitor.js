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

    isReplaceableFunction(text){
        for(let i = 0; i< this.functionPatterns.length; i++){
            const [[key, ]] = Object.entries(this.functionPatterns[i]);
            if(text.startsWith(key) || text.startsWith("await"+key)){
                return i
            }
        }
        return -1
    }

    replaceTestCall(ctx){
        let text = Array.isArray(ctx) ? ctx[0].getText() : ctx.getText();

        const functionIndex = this.isReplaceableFunction(text)
        //console.log("Text - " +this.serverInfo.id + "  <--> " + text)
        if(functionIndex >=0 ){
            // did i map every possible function call scenario ?
            // replace calls...
            // how ? I have which method is (get/post) but how to pass the args to it ?
            // the parameters have the same names as the original function definition, but how to get ?Add(again) on the config.yml...?
            ast.replaceFunctionCall(ctx, "")
            console.log("CTX - " + this.serverInfo.id + " - " + this.relativePath + " ------- " + text)
        }
        
    }

    visitExpressionSequence(ctx) {
        this.replaceTestCall(ctx.singleExpression());
        super.visitExpressionSequence(ctx);
    }

    visitVariableDeclaration(ctx) {
        this.replaceTestCall(ctx.singleExpression());
        super.visitVariableDeclaration(ctx);
    }
    
    visitArgument(ctx) {
        this.replaceTestCall(ctx.singleExpression());
        // function call args
        super.visitArgument(ctx);
    }
}

// Problems: 
/*
    gerar funções locais pro teste
        instalar dependencia supertest
        importar supertest 
    trocar na mão chamada nos testes
*/



/*const request = require('supertest');
const app = require('./app');

describe('API endpoints', () => {
  test('GET /hello deve retornar mensagem', async () => {
    const response = await request(app).get('/hello');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello, world!' });
  });

  test('POST /echo deve retornar os dados enviados', async () => {
    const payload = { nome: 'Lumi' };
    const response = await request(app).post('/echo').send(payload);
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(payload);
  });
});
 */