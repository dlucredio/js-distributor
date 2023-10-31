import { StringBuilder } from "./generator-utils.js";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import FunctionGenerator from "./function-generator.js";

export default class EventSourceGenerator extends FunctionGenerator {
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
    const functionName = ctx.identifier().getText();
    const serverInfo = this.functions.find((func) => func.name === functionName);

    if (serverInfo) {
      const server = this.servers.find((s) => s.id === serverInfo.server);
      const eventSourceURL = `http://${server.url}:${server.port}/${functionName}`;

      this.appendString(`const eventSource = new EventSource('${eventSourceURL}');`);
      this.appendNewLine();
      this.appendString(`eventSource.onmessage = (event) => {`);
      this.appendString(`  const result = JSON.parse(event.data);`);
      this.appendString(`  console.log(result);`);
      this.appendString(`};`);
      this.appendString();
      this.appendString(`eventSource.onerror = (error) => {`);
      this.appendString(`  console.error('Erro na conexão EventSource:', error);`);
      this.appendString(`};`);
    } else {
      console.error(`Função "${functionName}" não encontrada no arquivo YAML.`);
    }
  }
}
