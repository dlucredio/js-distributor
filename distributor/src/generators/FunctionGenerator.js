import CopyPasteGenerator from "./copypaste-generator.js";
import { StringBuilder } from "./generator-utils.js";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

// variavel global para permitir ou nao declaracao da funcao
let isFunctionDeclaration = false;

export default class FunctionGenerator extends CopyPasteGenerator {
  constructor() {
    super();
    this.servers = [];
    this.functions = [];
    this.numServers = 0;
    this.nameOfProject = "";
    this.codeGenerated = new Map();
    this.loadYAML();
  }

  loadYAML() {
    try {
      // const yamlPath = path.resolve('config.yml')
      // const yamlPath = path.resolve('config2.yml')
      const yamlPath = path.resolve('config4.yml')
      const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
      this.servers = config.servers;
      this.functions = config.functions;
      this.numServers = this.servers.length;
      this.nameOfProject = config.project.name;
    } catch (e) {
      console.error('Erro ao carregar o arquivo YAML:', e);
    }
  }

    // gera url com parametros por body do post ou query para get
    generateServerUrl(server, functionInfo, args) {
      let serverURL = `http://${server.url}:${server.port}/${functionInfo.name}`;
      
      if (functionInfo.method.toUpperCase() === 'POST') {
        let bodyCallInsideReq = '';
        if (functionInfo.parameters.length > 0) {
          let body = `{`;
          for (let parameter of functionInfo.parameters) {
            body += `${parameter.name}: ${parameter.name},`
          }
          body += `};`;
          this.appendString(`let body = ${body}`);
          this.appendString(`body = JSON.stringify(body);`)
          bodyCallInsideReq = 'body: body';
        }
        let reqPostBody = `\nmethod: "POST", \nheaders: {`;
        reqPostBody += `"Content-type": "application/json",\n}, ${bodyCallInsideReq}`
        serverURL += `', { ${reqPostBody}}`;
      } else if (functionInfo.method.toUpperCase() === 'GET' && functionInfo.parameters.length > 0) { // get e query
        serverURL += "?";
        for (let i = 0; i < functionInfo.parameters.length; i++) {
          serverURL += `${functionInfo.parameters[i].name}=' + ${args[i]}`
          if (functionInfo.parameters.length > 0 && i !== functionInfo.parameters.length-1) {
            serverURL += "+ '&"
          }
        }
      }
      return serverURL;
    }

  /* 
    sobreposicao de visitFunctionDeclaration   
  */
    visitFunctionDeclaration(ctx) {
      // Obtém o nome da função
      const functionName = ctx.identifier().getText();
      const functionInfo = this.functions.find((func) => func.name === functionName);
      const serverName = functionInfo.server
      const server = this.servers.find((server) => server.id === serverName);
      let args = [];
      
      // declaração da função
      this.appendString(`export async function ${functionName}(`);
    
      if (ctx.formalParameterList()) {
        args = this.visitFormalParameterList(ctx.formalParameterList());
      }
    
      this.appendString(`) {`);
      this.appendNewLine();
      let serverURL = this.generateServerUrl(server, functionInfo, args);
      
      let fetchCode = '';
      if (functionInfo.method.toUpperCase() === 'POST') {
        fetchCode = `const response = await fetch('${serverURL});`
      } else if (functionInfo.method.toUpperCase() === 'GET' && functionInfo.parameters.length > 0) {
        fetchCode = `const response = await fetch('${serverURL});`
      } else if (functionInfo.method.toUpperCase() === 'GET' && functionInfo.parameters.length === 0) {
        fetchCode = `const response = await fetch('${serverURL}');` ;
      }
        
      this.appendString(fetchCode);
      this.appendString('const { result } = await response.json();');
      this.appendString("return result;");
      this.appendNewLine();  
      this.appendString(`}`);
    }

    visitFormalParameterList(ctx) {
      const args = [];
      if (ctx.formalParameterArg().length !== 0) {
        for (let i = 0; i < ctx.formalParameterArg().length; i++) {
          this.visitFormalParameterArg(ctx.formalParameterArg(i));
          args.push(ctx.formalParameterArg(i).assignable().getText());
          if (i !== ctx.formalParameterArg().length - 1) this.appendString(", ");
        }
    
        if (ctx.lastFormalParameterArg()) { 
          this.appendString("," );
          this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
          args.push(ctx.formalParameterArg(i).assignable().getText());
        }
      } else {
        this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
        args.push(ctx.formalParameterArg(i).assignable().getText());
      }

      return args;
    }

  generateImportFetch() {
    let importFetchString = "import fetch from 'node-fetch';";
    this.codeGenerated.set('allfunctions', importFetchString + this.codeGenerated.get('allfunctions'));
    
    for (let server of this.servers) {
      this.codeGenerated.set(server.id, importFetchString );
    } 
  }

  generateFunctions(ctx) {
    this.generateImportFetch();

    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration()) { // achou um servidor
            // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            for (let funct of this.functions) {
              if (funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
                // let newCode = functionCode.get(funct.server);
                let newCode = this.codeGenerated.get(funct.server);
                if (newCode === undefined) {
                  newCode = this.stringBuilder.toString();
                } else {
                  newCode += this.stringBuilder.toString();
                }
                // functionCode.set(funct.server, newCode);
                this.codeGenerated.set(funct.server, newCode);
              }
            }
          }
      }   
    }
    // this.generateImportFetch();
    return this.codeGenerated;
  }
}