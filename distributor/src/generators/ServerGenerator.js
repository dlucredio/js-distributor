import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./FunctionGenerator.js";
import path from "path";
import fs from "fs";
import beautify from "js-beautify";

export default class ServerGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.currentServerName = "";
    this.functionsImportedInsideServer = new Map();
    this.filesInitialized = [];
  }

  generateRouteCode(functionInfo) {
    if (functionInfo.method.toUpperCase() === 'GET') {
      this.appendString(`app.get('/${functionInfo.name}`);
      this.appendString("'")
      this.appendString(`,async (req, res) => {`);
    } else if (functionInfo.method.toUpperCase() === 'POST') {
      this.appendString(`app.post('/${functionInfo.name}', async (req, res) => {`);
    } 
    else if (functionInfo.method.toUpperCase() !== 'RABBIT') {
      console.error("Invalid method. It must be get, post or rabbit");
    }
  }

  checkAsyncFunction(functionInfo, functionDeclCtx) {
    for (let funct of this.functions) {
      if (funct.name !== functionInfo.name && 
          functionDeclCtx.functionBody().getText().includes(funct.name)
          ) {
        return true;
      }
    }
    return false;
  }
  // && funct.server !== functionInfo.server

  // checkAsyncAnounymousFunctionDecl(ctx) {
  //   // console.log("chegou", anonymousFunctionCtx)
  //   let isAsync = false;
  //   if (anonymousFunctionCtx.functionBody()) {
  //     for (let functionInfo of this.functions) {
  //       let functionServer = functionInfo.server;
  //       if (anonymousFunctionCtx.functionBody().getText().includes(functionInfo.name) &&
  //         (functionServer !== this.currentServerName)) 
  //           isAsync = true;
  //     }
  //   } else if (anonymousFunctionCtx.arrowFunctionBody()) {
  //     for (let functionInfo of this.functions) {
  //       let functionServer = functionInfo.server;
  //       if (anonymousFunctionCtx.arrowFunctionBody().getText().includes(functionInfo.name) &&
  //         (functionServer !== this.currentServerName)) 
  //           isAsync = true;
  //     }
  //   }
  //   return isAsync;
  // }

  checkAsyncAnounymousArrowFunction(ctx) {
    let isAsync = false;
    if (ctx.arrowFunctionBody()) {
      for (let functionInfo of this.functions) {
        let functionServer = functionInfo.server;
        if (ctx.arrowFunctionBody().getText().includes(functionInfo.name) &&
          (functionServer !== this.currentServerName)) 
            isAsync = true;
      }
    }

    return isAsync;
  }

  checkAsyncAnounymousFunctionDecl(ctx) {
    let isAsync = false;
    if (ctx.functionBody()) {
      for (let functionInfo of this.functions) {
        let functionServer = functionInfo.server;
        if (ctx.functionBody().getText().includes(functionInfo.name) &&
          (functionServer !== this.currentServerName)) 
            isAsync = true;
      }
    }

    return isAsync;
  }
  

  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find((func) => func.name === functionName);
    const isAsync = ctx.identifier().Async() !== null || this.checkAsyncFunction(functionInfo, ctx);
    if (functionInfo) {

      // geracao do codigo da rota post ou get
      this.generateRouteCode(functionInfo);
      const queryOrBody = functionInfo.method.toUpperCase() === 'POST' ? 'body' : 'query';

      // Processar parâmetros da função vindas do yml
      functionInfo.parameters.forEach((param) => {
        this.appendString(`  const ${param.name} = req.${queryOrBody}.${param.name};`);
      });

      this.appendString();
      if (isAsync) this.appendString(`  const result = await ${functionName}(`);
      else this.appendString(`  const result = ${functionName}(`);
      const paramNames = functionInfo.parameters.map((param) => param.name).join(', ');
      this.appendString(`    ${paramNames}`);
      this.appendString(`  );`);
      this.appendString(`  return res.json({ result });`);
      this.appendString(`});`);
      this.appendString();

      // cópia async da função que fica no servidor para ser chamada posteriormente com um await
      if(isAsync) this.appendString(`async function ${functionName}(${paramNames})`)
      else this.appendString(`function ${functionName}(${paramNames})`);

      if (ctx.functionBody()) {
        this.visitFunctionBody(ctx.functionBody());
        }
    } else {
      console.error(`Servidor com ID "${functionName}" não encontrado no arquivo YAML.`);
    }
  }

  visitArgumentsExpression(ctx) {
    const functionName = ctx.children[0].getText();
    // tester se é uma funcao do servidor ou uma funcao de outro servidor
    const functionInfo = this.functions.find((func) => func.name === functionName);

    if (functionInfo && functionInfo.server !== this.currentServerName) {
      this.generateImports(functionInfo, ctx.children[1]);
    }

    // para evitar await repetidos em funcoes async com chamada await
    if (functionInfo && !ctx.parentCtx.getText().includes("await"))
      this.appendString("await ");      
    
    super.visitArgumentsExpression(ctx);
  }



  visitExportStatement(ctx, funct) {
    if (ctx.declaration().functionDeclaration() && ctx.declaration().functionDeclaration().identifier().getText() === funct.name) {
      this.currentFunction  = funct;
      this.currentServerName = funct.server;
      this.visitFunctionDeclaration(ctx.declaration().functionDeclaration());
      let newCode = this.codeGenerated.get(funct.server);
      if (!newCode) newCode = this.stringBuilder.toString();
      else  newCode += this.stringBuilder.toString();
      this.codeGenerated.set(funct.server, newCode);
      this.currentServerName = "";
    }
  }

  checkExportFunctionsDeclarations(sourceElementCtx, funct) {
    if (sourceElementCtx.statement().exportStatement()) {
      const exportStatementCtx = sourceElementCtx.statement().exportStatement();
      this.visitExportStatement(exportStatementCtx, funct);
    }
  }

  // anonymousFunction
  //   : Async? Function_ '*'? '(' formalParameterList? ')' functionBody    # AnonymousFunctionDecl
  //   | Async? arrowFunctionParameters '=>' arrowFunctionBody                     # ArrowFunction
  //   ;

  visitAnonymousFunctionDecl(ctx) {
    if (ctx.Async() || this.checkAsyncAnounymousFunctionDecl(ctx)) this.appendString("async ");
    this.appendTokens(ctx.Function_());
    if (ctx.children[0].getText().includes("*") || ctx.children[1].getText().includes("*")) this.appendString("*");
    this.appendString("(");
    if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  visitArrowFunction(ctx) {
    if (ctx.Async() || this.checkAsyncAnounymousArrowFunction(ctx)) this.appendString("async ");
    this.visitArrowFunctionParameters(ctx.arrowFunctionParameters());
    this.appendString(" => ");
    this.visitArrowFunctionBody(ctx.arrowFunctionBody());

  }
  
  checkDoubleImport(importSearched, functionInfo) {
    let isAlreadyImported = false;
    const functionsImported = this.functionsImportedInsideServer.get(this.currentServerName); 
    
    if (functionsImported) 
      isAlreadyImported = functionsImported.includes(functionInfo.name);

    return isAlreadyImported || this.checkDoubleImportAux(importSearched);
  }

  // checkar se importacao de uma funcao nao foi feita no servidor por outro arquivo anterior
  checkDoubleImportAux(importSearched) {
    // le arquivo do servidor correspondente
    const filepath = `./src-gen/modifiedNodeServer-${this.currentServerName}.js`;
    
    // se arquivo existe e servidor ja foi inicializado (garante que nao esta executando novamente com arquivos existentes em src-gen)
    if (fs.existsSync(filepath) && this.filesInitialized.includes(filepath)) {
        
      try {
        const code = fs.readFileSync(filepath, 'utf8');

        // testa se import sendo feito ja esta nesse arquivo
        if (code.includes(beautify(importSearched, {
          indent_size: 4,
          space_in_empty_paren: true,
        }))) { 
          return true; // se tiver, return true
        } else return false; // se nao tiver, retorna false
      } catch(e) { 
        console.log(e);
        return; 
      }
    } 
    
    return false;
  }

  // gera imports necessarios
  generateImports(functionInfo) {
    const filename = `modifiedNode-${functionInfo.server}.js`;
    const importPath = `./${filename}`;
    let importCode = `import { ${functionInfo.name} } from "${importPath}";`;
    
    if (!this.checkDoubleImport(importCode, functionInfo)) {
      if (this.codeGenerated.get(this.currentServerName)) importCode += this.codeGenerated.get(this.currentServerName);
      this.codeGenerated.set(this.currentServerName, importCode);
      this.functionsImportedInsideServer.set(this.currentServerName, functionInfo.name);
    }
  }



  generateFunctions(ctx, filesInitialized) {
    // for (let i = 0; i < this.numServers; i++) {
    //   this.appendString("import express from 'express';")
    //   this.appendString(`const app = express();`);
    //   this.appendString(`const port = ${this.servers[i].port};`); 
    //   this.appendString();
    //   this.appendString(`app.use(express.json());`);
    //   this.appendString();
    //   this.appendString(`app.listen(port, () => {`);
    //   this.appendString(`  console.log('Servidor rodando na porta ' + port);`);
    //   this.appendString(`});`);
    //   this.appendNewLine();
    //   let codeGenerated = this.stringBuilder.toString();
    //   this.stringBuilder = new StringBuilder();

    //   // serverCodes.set(this.servers[i].id, codeGenerated);
    //   this.codeGenerated.set(this.servers[i].id, codeGenerated);
    // }
    this.filesInitialized = filesInitialized;
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration() ||
              sourceElements[i].statement().exportStatement()) {
            // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            for (let funct of this.functions) {
              if (sourceElements[i].statement().functionDeclaration() && 
                  funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
                this.currentFunction  = funct;
                this.currentServerName = funct.server;
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
                let newCode = this.codeGenerated.get(funct.server);
                if (!newCode) newCode = this.stringBuilder.toString();
                else  newCode += this.stringBuilder.toString();
                this.codeGenerated.set(funct.server, newCode);
                this.currentServerName = "";
              } else if (sourceElements[i].statement().exportStatement()){
                this.checkExportFunctionsDeclarations(sourceElements[i], funct)
              }
            }
          }
      }   
    }
    return this.codeGenerated;
  }
}
