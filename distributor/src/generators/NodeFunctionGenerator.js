import FunctionGenerator from "./function-generator.js";
import { StringBuilder } from "./generator-utils.js";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";

export default class NodeFunctionGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.stringBuilder = new StringBuilder();
    this.servers = [];
    this.functions = [];
    this.numServers = 0;
    this.loadYAML();
  }

  loadYAML() {
    try {
      console.log("Numero de server:" + this.numServers)
      const yamlPath = path.resolve('..', '..', 'distributor', 'src', 'config.yml');
      const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
      this.servers = config.servers;
      this.functions = config.functions;
      this.numServers = this.servers.length;
    } catch (e) {
      console.error('Erro ao carregar o arquivo YAML:', e);
    }
  }

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
    const server = this.functions.find((func) => func.name === functionName);
  
    if (server) {
      const serverURL = `http://${this.servers[server.server - 1].url}:${this.servers[server.server - 1].port}/${functionName}`;
      const fetchCode = isAsync
        ? `const response = await fetch('${serverURL}');`
        : `const response = fetch('${serverURL}');`;
  
      this.appendString(fetchCode);
      this.appendString(isAsync ? 'const result = await response.json();' : 'const result = response.json();');
    }
    this.appendNewLine();
  
    if (ctx.functionBody()) {
      this.visitFunctionBody(ctx.functionBody());
    }
  
    this.appendString(`}`);
  }
}
