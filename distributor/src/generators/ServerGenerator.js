import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./FunctionGenerator.js";

export default class ServerGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.currentServerName = "";
  }

  generateRouteCode(functionInfo) {
    if (functionInfo.method.toUpperCase() === 'GET') {
      this.appendString(`app.get('/${functionInfo.name}`);
      this.appendString("'")
      this.appendString(`,async (req, res) => {`);
    } else if (functionInfo.method.toUpperCase() === 'POST') {
      this.appendString(`app.post('/${functionInfo.name}', async (req, res) => {`);
    } else {
      console.error("Invalid HTTP method. It must be get or post");
    }
  }

  checkAsyncFunction(functionInfo, functionDeclCtx) {
    for (let funct of this.functions) {
      if (funct.name !== functionInfo.name && 
          functionDeclCtx.functionBody().getText().includes(funct.name) && 
          funct.server !== functionInfo.server
          ) {
        return true;
      }
    }
    return false;
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
      this.appendString("await ");    
      // this.addAsyncAndAwait()
    }
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
      console.log("salvou para", funct.server);
    }
  }

  checkExportFunctionsDeclarations(sourceElementCtx, funct) {
    if (sourceElementCtx.statement().exportStatement()) {
      const exportStatementCtx = sourceElementCtx.statement().exportStatement();
      this.visitExportStatement(exportStatementCtx, funct);
    }
  }

  // visitAnonymousFunction(ctx) {
  //   super.visitAnonymousFunction(ctx);
  // }

  generateImports(functionInfo) {
    const filename = `./modifiedNode-${functionInfo.server}.js`;
    const importPath = `./${filename}`;
    let importCode = `import { ${functionInfo.name} } from "${importPath}";`;
    if (this.codeGenerated.get(this.currentServerName)) importCode += this.codeGenerated.get(this.currentServerName);
    this.codeGenerated.set(this.currentServerName, importCode);
  }


  generateFunctions(ctx) {
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
