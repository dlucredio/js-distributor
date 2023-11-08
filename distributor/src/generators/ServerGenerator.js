import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./function-generator.js";
import path from "path"

export default class ServerGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.currentServerName = "";
  }

  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find((func) => func.name === functionName);
    // this.currentServerName = functionInfo.server;
    const isAsync = ctx.identifier().Async() !== null;
  
    if (functionInfo) {
      this.appendString(`app.get('/${functionName}', async (req, res) => {`);
      
      // Processar parâmetros da função vindas do yml
      functionInfo.parameters.forEach((param) => {
        this.appendString(`  const ${param.name} = req.query.${param.name};`);
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
    // tester se teste é uma funcao do servidor ou uma funcao de outro servidor
    const functionInfo = this.functions.find((func) => func.name === functionName);
    if (functionInfo && functionInfo.server !== this.currentServerName) {
      this.generateImports(functionInfo, ctx.children[1]);    
    }
    super.visitArgumentsExpression(ctx);
  }

  // generateFetchCode(functionName, argsCtx) {
  //   const args = argsCtx.argument();
  //   this.appendString("(() => {");
  //   const functionInfo = this.functions.find((func) => func.name === functionName);
  //     // console.log("serverName", serverName, "para funcao", functionName)
  //     const server = this.servers.find((server) => server.id === functionInfo.server);
  //     if (server) {
  //       // console.log(server)
  //       let serverURL = `http://${server.url}:${server.port}/${functionName}`;
  //       if (functionInfo.parameters.length > 0) serverURL += `?`;
  //       for (let i = 0; i < functionInfo.parameters.length; i++) {
  //           serverURL += `${functionInfo.parameters[i].name}=`+args[i].getText();
  //           if (i+1 < functionInfo.parameters.length) serverURL += "&";
  //       }
  //       const fetchCode = `const response = fetch('${serverURL}');`;
  
  //       this.appendString(fetchCode);
  //       this.appendString('const result = response.json();');
  //       this.appendString("return result;");
  //     }
  //   this.appendString("})()"); 
  // }

  generateImports(functionInfo) {
    const filename = `${this.nameOfProject}-functions-${functionInfo.server}.js`;
    const importPath = `./${filename}`;

    let code = `import ${functionInfo.name} from "${importPath}";` + this.codeGenerated.get(this.currentServerName);
    this.codeGenerated.set(this.currentServerName, code);
  }


  generateFunctions(ctx) {
    for (let i = 0; i < this.numServers; i++) {
      this.appendString(`const express = require('express');`);
      this.appendString(`const app = express();`);
      this.appendString(`const port = ${this.servers[i].port};`); 
      this.appendString();
      this.appendString(`app.use(express.json());`);
      this.appendString();
      this.appendString(`app.listen(port, () => {`);
      this.appendString(`  console.log('Servidor rodando na porta ' + port);`);
      this.appendString(`});`);
      this.appendNewLine();
      let codeGenerated = this.stringBuilder.toString();
      this.stringBuilder = new StringBuilder();

      // serverCodes.set(this.servers[i].id, codeGenerated);
      this.codeGenerated.set(this.servers[i].id, codeGenerated);
    }
    
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration()) {
            // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            for (let funct of this.functions) {
              if (funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
                this.currentFunction  = funct;
                this.currentServerName = funct.server;
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
                let newCode = this.codeGenerated.get(funct.server);
                newCode += this.stringBuilder.toString();
                this.codeGenerated.set(funct.server, newCode);
                this.currentServerName = "";
              }
            }
          }
      }   
    }
    return this.codeGenerated;
  }
}
