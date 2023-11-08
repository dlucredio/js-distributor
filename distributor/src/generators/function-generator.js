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
    this.loadYAML();
  }

  loadYAML() {
    try {
      const yamlPath = path.resolve('config.yml')
      const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
      this.servers = config.servers;
      this.functions = config.functions;
      this.numServers = this.servers.length;
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
    
      // Verifica se a função é assíncrona
      const isAsync = ctx.Async() !== null;
    
      // declaração da função
      this.appendString(`${isAsync ? 'async ' : ''}function ${functionName}(`);
    
      if (ctx.formalParameterList()) {
        this.visitFormalParameterList(ctx.formalParameterList());
      }
    
      this.appendString(`) {`);
      this.appendNewLine();
    
      // Puxando infos do YAML para gerar a URL
      const serverName = (this.functions.find((func) => func.name === functionName)).server;
      const server = this.servers.find((server) => server.id === serverName);
      if (server) {
        const serverURL = `http://${server.url}:${server.port}/${functionName}`;
        const fetchCode = isAsync
          ? `const response = await fetch('${serverURL}');`
          : `const response = fetch('${serverURL}');`;
  
        this.appendString(fetchCode);
        this.appendString(isAsync ? 'const result = await response.json();' : 'const result = response.json();');
        this.appendString("return result;");
      }
      this.appendNewLine();  
      this.appendString(`}`);
    }

    generateFetchCode() {
      
    }

  generateFunctions(ctx) {
    const functionCode = new Map();
    /*
      todos codigos gerados:
        - posicao 0: todas chamadas de funcoes
        - posicao i | i != 0: chamadas de funcoes do server i
    */
    // console.log(this.servers[0].id)
    // visitar programa para gerar codigo do arquivo de entrada sem declaracao da funcao
    this.visitProgram(ctx);
    // colocar codigo gerado em array
    // generatedCode[0] = this.stringBuilder.toString();
    functionCode.set("allfunctions", this.stringBuilder.toString())

    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration()) {
            // // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            for (let funct of this.functions) {
              if (funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
                let newCode = functionCode.get(funct.server);
                if (newCode === undefined) {
                  newCode = this.stringBuilder.toString();
                } else {
                  newCode += this.stringBuilder.toString();
                }
                functionCode.set(funct.server, newCode);
              }
            }
          }
      }   
    }
    return functionCode;
  }
}

// {

    // definicao de servers com urls, porta, etc
    // definicao de funcoes, seu argumentos e o server


// }