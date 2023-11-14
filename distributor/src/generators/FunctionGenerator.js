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
      const yamlPath = path.resolve('config.yml')
      const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
      this.servers = config.servers;
      this.functions = config.functions;
      this.numServers = this.servers.length;
      this.nameOfProject = config.project.name;
    } catch (e) {
      console.error('Erro ao carregar o arquivo YAML:', e);
    }
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
      // this.appendString(`${isAsync ? 'async ' : ''}function ${functionName}(`);
      this.appendString(`export async function ${functionName}(`);
    
      if (ctx.formalParameterList()) {
        args = this.visitFormalParameterList(ctx.formalParameterList());
      }
    
      this.appendString(`) {`);
      this.appendNewLine();
    
      // Puxando infos do YAML para gerar a URL
      // if (server) {
      //   const serverURL = `http://${server.url}:${server.port}/${functionName}`;
      //   const fetchCode = isAsync
      //     ? `const response = await fetch('${serverURL}');`
      //     : `const response = fetch('${serverURL}');`;
      let serverURL = `http://${server.url}:${server.port}/${functionName}`;

      // (!!!) adicao de query nas chamadas fetchs - retirar dps se tiver errado
      if (functionInfo.parameters.length > 0) {
        serverURL += "?";
        for (let i = 0; i < functionInfo.parameters.length; i++) {
          serverURL += `${functionInfo.parameters[i].name}=' + ${args[i]}`
          if (functionInfo.parameters.length > 0 && i !== functionInfo.parameters.length-1) {
            serverURL += "+ '&"
          }
        }
      }
      const fetchCode = functionInfo.parameters.length > 0 ? `const response = await fetch('${serverURL});` : `const response = await fetch('${serverURL}');` ;
  
        
      this.appendString(fetchCode);
      this.appendString('const result = await response.json();');
      this.appendString("return result;");
      this.appendNewLine();  
      this.appendString(`}`);
    }

    /* (!!!) serve para retornar args pra poder usar na query da chamada fetch - talvez retirar se tiver errado 
    formalParameterArg
    : assignable ('=' singleExpression)?      // ECMAScript 6: Initialization
    ;

    lastFormalParameterArg                        // ECMAScript 6: Rest Parameter
    : Ellipsis singleExpression
    ;
    */
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

  generateFunctions(ctx) {
    this.visitProgram(ctx);
    this.codeGenerated.set("allfunctions", this.stringBuilder.toString())

    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration()) {
            // // reinicio de stringBuilder
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
    return this.codeGenerated;
  }
}

// {

    // definicao de servers com urls, porta, etc
    // definicao de funcoes, seu argumentos e o server


// }