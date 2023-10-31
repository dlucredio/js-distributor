import { StringBuilder } from "./generator-utils.js";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import FunctionGenerator from "./function-generator.js";

export default class ServerGenerator extends FunctionGenerator {
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
    const server = this.servers.find((s) => s.id === serverInfo.server);
    if (serverInfo) {
      this.appendString(`const express = require('express');`);
      this.appendString(`const app = express();`);
      this.appendString(`const port = ${server.port};`); //corrigir está vindo undefined
      this.appendString();
      this.appendString(`app.use(express.json());`);
      this.appendString();
      this.appendString(`app.get('/${functionName}', async (req, res) => {`);
      
      // Processar parâmetros da função vindas do yml
      serverInfo.parameters.forEach((param) => {
        this.appendString(`  const ${param.name} = req.query.${param.name};`);
      });

      this.appendString();
      this.appendString(`  const result = await ${functionName}(`);
      const paramNames = serverInfo.parameters.map((param) => param.name).join(', ');
      this.appendString(`    ${paramNames}`);
      this.appendString(`  );`);
      this.appendString(`  return res.json({ result });`);
      this.appendString(`});`);
      this.appendString();
      this.appendString(`app.listen(port, () => {`);
      this.appendString(`  console.log('Servidor rodando na porta ' + port);`);
      this.appendString(`});`);
      this.appendNewLine();

      // cópia async da função que fica no servidor para ser chamada posteriormente com um await
      this.appendString(`async function ${functionName}(${paramNames})`)
      this.appendString("{")
      if (ctx.functionBody()) {
        this.visitFunctionBody(ctx.functionBody());
        }
      this.appendString("}")
    } else {
      console.error(`Servidor com ID "${functionName}" não encontrado no arquivo YAML.`);
    }
  }
}
