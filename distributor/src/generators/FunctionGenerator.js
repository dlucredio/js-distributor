import CopyPasteGenerator from "./copypaste-generator.js";
import { StringBuilder } from "./generator-utils.js";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

// variavel global para permitir ou nao declaracao da funcao
let isFunctionDeclaration = false;

export default class FunctionGenerator extends CopyPasteGenerator {
  constructor(outputDir) {
    super();
    this.outputDir = outputDir;
    this.servers = [];
    this.functions = [];
    this.numServers = 0;
    this.nameOfProject = "";
    this.functionDeclared = {};
    this.codeGenerated = new Map();
    this.amqpImported = false;
    this.functionMap = this.buildFunctionMap(this.functions);
    this.loadYAML();
  }

  loadYAML() {
    try {
      const yamlPath = path.resolve("config4.yml");
      // const yamlPath = path.resolve('config2.yml')
      // const yamlPath = path.resolve('config4.yml')
      const config = yaml.load(fs.readFileSync(yamlPath, "utf8"));
      this.servers = config.servers;
      this.functions = config.functions;
      this.numServers = this.servers.length;
      // this.nameOfProject = config.project.name;
    } catch (e) {
      console.error("Erro ao carregar o arquivo YAML:", e);
    }
  }

  buildFunctionMap(functions) {
    const functionMap = {};
    functions.forEach((func) => {
      if (!functionMap[func.server]) {
        functionMap[func.server] = [];
      }
      functionMap[func.server].push(func);
    });
    return functionMap;
  }

  // gera url com parametros por body do post ou query para get
  generateServerUrl(server, functionInfo, args) {
    let serverURL = `http://${server.url}:${server.port}/${functionInfo.name}`;

    if (functionInfo.method.toUpperCase() === "POST") {
      let bodyCallInsideReq = "";
      if (functionInfo.parameters.length > 0) {
        let body = `{`;
        for (let parameter of functionInfo.parameters) {
          body += `${parameter.name}: ${parameter.name},`;
        }
        body += `};`;
        this.appendString(`let body = ${body}`);
        this.appendString(`body = JSON.stringify(body);`);
        bodyCallInsideReq = "body: body";
      }
      let reqPostBody = `\nmethod: "POST", \nheaders: {`;
      reqPostBody += `"Content-type": "application/json",\n}, ${bodyCallInsideReq}`;
      serverURL += `', { ${reqPostBody}}`;
    } else if (
      functionInfo.method.toUpperCase() === "GET" &&
      functionInfo.parameters.length > 0
    ) {
      // get e query
      serverURL += "?";
      for (let i = 0; i < functionInfo.parameters.length; i++) {
        serverURL += `${functionInfo.parameters[i].name}=' + ${args[i]}`;
        if (
          functionInfo.parameters.length > 0 &&
          i !== functionInfo.parameters.length - 1
        ) {
          serverURL += "+ '&";
        }
      }
    }
    return serverURL;
  }
  buildFunctionMap(functions) {
    const functionMap = {};
    functions.forEach((func) => {
      if (!functionMap[func.server]) {
        functionMap[func.server] = [];
      }
      functionMap[func.server].push(func);
    });
    return functionMap;
  }
  /* 
    sobreposicao de visitFunctionDeclaration   
  */
  visitFunctionDeclaration(ctx) {
    // Obtém o nome da função
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find(
      (func) => func.name === functionName
    );
    const serverName = functionInfo.server;
    const server = this.servers.find((server) => server.id === serverName);
    let args = [];

    // declaração da função
    if (functionInfo.method.toUpperCase() !== "RABBIT") {
      this.appendString(`export async function ${functionName}(`);

      if (ctx.formalParameterList()) {
        args = this.visitFormalParameterList(ctx.formalParameterList());
      }

      this.appendString(`) {`);
      this.appendNewLine();
      let serverURL = this.generateServerUrl(server, functionInfo, args);

      let fetchCode = "";
      if (functionInfo.method.toUpperCase() === "POST") {
        fetchCode = `const response = await fetch('${serverURL});`;
      } else if (
        functionInfo.method.toUpperCase() === "GET" &&
        functionInfo.parameters.length > 0
      ) {
        fetchCode = `const response = await fetch('${serverURL});`;
      } else if (
        functionInfo.method.toUpperCase() === "GET" &&
        functionInfo.parameters.length === 0
      ) {
        fetchCode = `const response = await fetch('${serverURL}');`;
      }

      this.appendString(fetchCode);
      this.appendString("const { result } = await response.json();");
      this.appendString("return result;");
      this.appendNewLine();
      this.appendString(`}`);
    }
    // Parte rabbit
    else if (functionInfo.method.toUpperCase() === "RABBIT") {
      const paramNames = functionInfo.parameters
        .map((param) => param.name)
        .join(", ");
      const connectionUrl = server.rabbitmq.connectionUrl || "amqp://localhost";
      if(this.amqpImported == false){
        this.appendString(`import amqp from 'amqplib';`);
        this.amqpImported = true;
      }
      
      this.appendString(
        `export async function ${functionName}(${paramNames}) {`
      );
      this.appendString(`  const p = new Promise(async (resolve, reject) => {`);
      this.appendString(`    try {`);
      this.appendString(`      console.log("Conectando ao RabbitMQ...");`);
      this.appendString(
        `      const connection = await amqp.connect("${connectionUrl}");`
      );
      this.appendString(`      console.log("Conexão bem-sucedida!");`);
      this.appendString(
        `      console.log("Enviando chamada para a função ${functionName}");`
      );
      this.appendString(
        `      const channel = await connection.createChannel();`
      );
      this.appendString(`      let queueName = "${server.rabbitmq.queue}";`);
      this.appendString(
        `      console.log("Declarando fila: ${server.rabbitmq.queue}");`
      );
      this.appendString(`      await channel.assertQueue(queueName, {`);
      this.appendString(`        durable: false,`);
      this.appendString(`      });`);
      this.appendString(`      const callObj = {`);
      this.appendString(`        funcName: "${functionName}",`);
      this.appendString(`        type: "call",`);
      this.appendString(`        parameters: {`);
      for (const paramName of functionInfo.parameters) {
        this.appendString(`          ${paramName.name}: ${paramName.name},`);
      }
      this.appendString(`        },`);
      this.appendString(`      };`);
      this.appendString(`      channel.consume(`);
      this.appendString(`        queueName,`);
      this.appendString(`        (msg) => {`);
      this.appendString(`          if (msg) {`);
      this.appendString(
        `            const message = JSON.parse(msg.content.toString());`
      );
      this.appendString(
        `            console.log("Recebendo resposta para a função ${functionName}");`
      );
      this.appendString(
        `            if (message.funcName === "${functionName}" && message.type === "response") {`
      );
      this.appendString(`              const result = message.result;`);
      this.appendString(
        `              console.log("Resposta recebida:", result);`
      );
      this.appendString(`              resolve(result);`);
      this.appendString(`            }`);
      this.appendString(`          }`);
      this.appendString(`        },`);
      this.appendString(`        {`);
      this.appendString(`          noAck: true,`);
      this.appendString(`        }`);
      this.appendString(`      );`);
      this.appendString(
        `      console.log("Enviando mensagem para a fila: ${server.rabbitmq.queue}");`
      );
      this.appendString(
        `      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));`
      );
      this.appendString(`    } catch (error) {`);
      this.appendString(
        `      console.error("Erro ao processar chamada para a função ${functionName}:", error);`
      );
      this.appendString(`      reject(error);`);
      this.appendString(`    }`);
      this.appendString(`  });`);
      this.appendString(`  return p;`);
      this.appendString(`}`);
      this.appendNewLine();
    }
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
        this.appendString(",");
        this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
        args.push(ctx.formalParameterArg(i).assignable().getText());
      }
    } else {
      this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
      args.push(ctx.formalParameterArg(i).assignable().getText());
    }

    return args;
  }

  // generateImportFetch() {
  //   let importFetchString = "import fetch from 'node-fetch';";

  //   for (let server of this.servers) {

  //     console.log(!code.includes(importFetchString))
  //     if (!code || !code.includes(importFetchString))
  //       this.codeGenerated.set(server.id, importFetchString );
  //   }
  // }

  visitExportStatement(ctx, funct) {
    const declarationCtx = ctx.declaration();
    if (!declarationCtx) return;
    else if (
      declarationCtx.functionDeclaration() &&
      ctx.declaration().functionDeclaration().identifier().getText() ===
        funct.name
    ) {
      this.currentFunction = funct;
      this.currentServerName = funct.server;
      this.visitFunctionDeclaration(ctx.declaration().functionDeclaration());
      let newCode = this.codeGenerated.get(funct.server);
      if (!newCode) newCode = this.stringBuilder.toString();
      else newCode += this.stringBuilder.toString();
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

  generateFunctions(ctx) {
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (
          sourceElements[i].statement().functionDeclaration() ||
          sourceElements[i].statement().exportStatement()
        ) {
          this.stringBuilder = new StringBuilder();
          for (let funct of this.functions) {
            const statement = sourceElements[i].statement();
            if (statement.functionDeclaration()) {
              const functionName = statement
                .functionDeclaration()
                .identifier()
                .getText();
              if (funct.name === functionName) {
                if (
                  funct.method.toUpperCase() === "POST" ||
                  funct.method.toUpperCase() === "GET" ||
                  funct.method.toUpperCase() === "RABBIT"
                ) {
                  this.visitFunctionDeclaration(
                    statement.functionDeclaration()
                  );
                  let newCode = this.codeGenerated.get(funct.server);
                  if (newCode === undefined) {
                    newCode = this.stringBuilder.toString();
                  } else {
                    newCode += this.stringBuilder.toString();
                  }
                  this.codeGenerated.set(funct.server, newCode);
                }
              }
            } else if (statement.exportStatement()) {
              this.checkExportFunctionsDeclarations(sourceElements[i], funct);
            }
          }
        }
      }
    }
    return this.codeGenerated;
  }
}
