import CopyPasteGenerator from "./copypaste-generator.js";
import { StringBuilder } from "./generator-utils.js";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

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

  /**
   * Loads information from the YAML file into the class attributes.
   */
  loadYAML() {
    try {
      const yamlPath = path.resolve("config.yml");
      const config = yaml.load(fs.readFileSync(yamlPath, "utf8"));
      this.servers = config.servers;
      this.functions = config.functions;
      this.numServers = this.servers.length;
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


  /**
  * Generates fetch call URLs corresponding to the functions, using query to
  * pass arguments for GET calls and body for POST calls.
  * @param {*} server - server information to which the call belongs
  * @param {*} functionInfo - information about the function being called
  * @param {*} args - possible arguments of the function
  * @returns - URL of the call
  */
  generateServerUrl(server, functionInfo, args) {
    let serverURL = `http://${server.url}:${server.port}/${functionInfo.name}`;

    if (functionInfo.method.toUpperCase() === "POST") {
      let bodyCallInsideReq = "";
      if (functionInfo.parameters && functionInfo.parameters.length > 0) {
        let body = `{`;
        for (let parameter of args) {
          body += `${parameter}: ${parameter},`;
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
      functionInfo.parameters && functionInfo.parameters.length > 0
    ) {
      serverURL += "?";
      for (let i = 0; i < args.length; i++) {
        serverURL += `${args[i]}=' + ${args[i]}`;
        if (
          args.length > 0 &&
          i !== args.length - 1
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

  /**
  * Overriding of the visitFunctionDeclaration from copypaste to generate fetch call codes
  * or Rabbit's WaitForCall.
  * @param {*} ctx - function context
  */
  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find(
      (func) => func.name === functionName
    );
    const serverName = functionInfo.server;
    const server = this.servers.find((server) => server.id === serverName);
    let args = [];

    if (functionInfo.method.toUpperCase() !== "RABBIT") {
      this.appendString(`export async function ${functionName}(`);

      if (ctx.formalParameterList()) {
        args = this.visitFormalParameterListOnlyRead(ctx.formalParameterList());
      }

      this.appendString(args);
      this.appendString(`) {`);
      this.appendNewLine();
      let serverURL = this.generateServerUrl(server, functionInfo, args);

      let fetchCode = "";
      if (functionInfo.method.toUpperCase() === "POST") {
        fetchCode = `const response = await fetch('${serverURL});`;
      } else if (
        functionInfo.method.toUpperCase() === "GET" &&
        args.length > 0
      ) {
        fetchCode = `const response = await fetch('${serverURL});`;
      } else if (
        functionInfo.method.toUpperCase() === "GET" &&
        args.length > 0
      ) {
        fetchCode = `const response = await fetch('${serverURL}');`;
      }

      this.appendString(fetchCode);
      this.appendString("const { result } = await response.json();");
      this.appendString("return result;");
      this.appendNewLine();
      this.appendString(`}`);
    } else if (functionInfo.method.toUpperCase() === "RABBIT") {
      if (ctx.formalParameterList()) {
        args = this.visitFormalParameterListOnlyRead(ctx.formalParameterList());
      }

      const paramNames = args
        .join(", ");
      const connectionUrl = server.rabbitmq.connectionUrl || "amqp://localhost";
      const isExchange = !!functionInfo.exchange_name;
      let rpcQueue = `${functionInfo.name}_queue`;

      if (functionInfo.queue) {
        rpcQueue = functionInfo.queue;
      }

      let exchange_type = functionInfo.exchange_type ? `${functionInfo.exchange_type}` : 'fanout';
      let routingKey = functionInfo.routing_key ? `${functionInfo.routing_key}` : ``;

      let responseQueue = 'q.queue';

      this.appendString(
        `export async function ${functionName}(${paramNames}) {`
      );
      this.appendString(`  const p = new Promise(async (resolve, reject) => {`);
      this.appendString(`    try {`);
      this.appendString(`      console.log("Connecting to RabbitMQ...");`);
      this.appendString(
        `      const connection = await amqp.connect("${connectionUrl}");`
      );
      this.appendString(`      console.log("Connection established!");`);
      this.appendString(
        `      console.log("Sending call to function ${functionName}");`
      );
      this.appendString(
        `      const channel = await connection.createChannel();`
      );
      this.appendString(`      const q = await channel.assertQueue('', {`);
      this.appendString(`        exclusive: true,`);
      this.appendString(`      });`);
      if (isExchange) {
        this.appendString(`      let ${functionInfo.name}_exchange = '${functionInfo.exchange_name}';`);
        this.appendString(`      await channel.assertExchange(${functionInfo.name}_exchange, '${exchange_type}', {`);
        this.appendString(`        durable: false,`);
        this.appendString(`      });`);
        if (functionInfo.callback_queue && functionInfo.callback_queue !== 'anonymous') {
          this.appendString(`      await channel.bindQueue(q.queue, ${functionInfo.name}_exchange, '${functionInfo.callback_queue}');`);
        }
      } else {
        this.appendString(`      let queueName = "${rpcQueue}";`);
        this.appendString(
          `      console.log("Declaring queue: ${rpcQueue}");`
        );
        if (functionInfo.callback_queue && functionInfo.callback_queue !== 'anonymous') {
          this.appendString(`      let callbackQueue = "${functionInfo.callback_queue}";`);
          this.appendString(
            `  await channel.assertQueue(callbackQueue, { durable: false });`
          );
          responseQueue = 'callbackQueue';
        }
      }
      this.appendString(`      const correlationId = generateUuid();`);
      this.appendString(`      const callObj = {`);
      this.appendString(`        funcName: "${functionName}",`);
      this.appendString(`        parameters: {`);
      for (const parameter of args) {
        this.appendString(`          ${parameter}: ${parameter},`);
      }
      this.appendString(`        },`);
      this.appendString(`      };`);
      this.appendString(`      channel.consume(`);
      this.appendString(`        ${responseQueue},`);
      this.appendString(`        (msg) => {`);
      this.appendString(`          if (msg) {`);
      this.appendString(
        `            const message = JSON.parse(msg.content.toString());`
      );
      this.appendString(
        `            console.log("Receiving response for function ${functionName}");`
      );
      this.appendString(
        `            if (msg.properties.correlationId === correlationId) {`
      );
      this.appendString(`              const result = message.result;`);
      this.appendString(
        `              console.log("Response received:", result);`
      );
      this.appendString(`              resolve(result);`);
      this.appendString("channel.cancel(msg.fields.consumerTag);");
      this.appendString(`            }`);
      this.appendString(`          }`);
      this.appendString(`        },`);
      this.appendString(`        {`);
      this.appendString(`          noAck: true,`);
      this.appendString(`        }`);
      this.appendString(`      );`);
      if (isExchange) {
        this.appendString(
          `      channel.publish(${functionInfo.name}_exchange, '${routingKey}', Buffer.from(JSON.stringify(callObj))`);
      } else {
        this.appendString(
          `      console.log("Sending message to queue: ${rpcQueue}");`
        );
        this.appendString(
          `      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj))`);
      }
      this.appendString(`           , {correlationId: correlationId`);
      if (!functionInfo.callback_queue || functionInfo.callback_queue === 'anonymous') {
        this.appendString(`           ,replyTo: q.queue`);
      }
      this.appendString(`       });`);
      this.appendString(`    } catch (error) {`);
      this.appendString(
        `      console.error("Error processing call to function ${functionName}:", error);`
      );
      this.appendString(`      reject(error);`);
      this.appendString(`    }`);
      this.appendString(`  });`);
      this.appendString(`  return p;`);
      // Function generateUuid()
      this.appendString(`  function generateUuid() {`);
      this.appendString(`    return Math.random().toString() + Math.random().toString() + Math.random().toString();`);
      this.appendString(`  }`);
      // End Function generateUuid()
      this.appendString(`}`);
      this.appendNewLine();
    }
  }

  /**
  * Overriding visitFormalParameterList to obtain a list with generated function arguments and
  * also generate corresponding code for the formalParameterList rule.
  * @param {*} ctx - formalParameterList context
  * @returns - list with function arguments
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

  //Override visitFormalParameterList to only read
  visitFormalParameterListOnlyRead(ctx) {
    const args = [];
    if (ctx.formalParameterArg().length !== 0) {
      for (let i = 0; i < ctx.formalParameterArg().length; i++) {
        this.visitFormalParameterArgOnlyRead(ctx.formalParameterArg(i));
        args.push(ctx.formalParameterArg(i).assignable().getText());
      }

      if (ctx.lastFormalParameterArg()) {
        this.visitLastFormalParameterArgOnlyRead(ctx.lastFormalParameterArg());
        args.push(ctx.formalParameterArg(i).assignable().getText());
      }
    } else {
      this.visitLastFormalParameterArgOnlyRead(ctx.lastFormalParameterArg());
      args.push(ctx.formalParameterArg(i).assignable().getText());
    }

    return args;
  }

  //Override visitFormalParameterList to only read
  visitFormalParameterArgOnlyRead(ctx) {
    this.visitAssignableOnlyRead(ctx.assignable());
    if (ctx.children.length > 1) {
      this.visit(ctx.children[2]);
    }
  }

  //Override visitFormalParameterList to only read
  visitAssignableOnlyRead(ctx) {
    if (!ctx.identifier()) //this.visitIdentifier(ctx.identifier());
      //else this.visitChildren(ctx);
      this.visitChildren(ctx);
  }

  //Override visitFormalParameterList to only read
  visitLastFormalParameterArgOnlyRead(ctx) {
    this.appendTokens(ctx.Ellipsis());
    this.visitChildren(ctx);
  }

  /**
  * Overriding of visitExportStatement to test if there is any function defined in the YAML file with
  * export in the input file and generate corresponding code.
  * @param {*} ctx - exportStatement context
  * @param {*} funct - function defined in the YAML file that is checked in the exportStatement
  * @returns - void
  */
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


  /**
  * Helper function to test YAML function definitions by export.
  * @param {*} sourceElementCtx - sourceElement context
  * @param {*} funct - YAML function being searched
  */
  checkExportFunctionsDeclarations(sourceElementCtx, funct) {
    if (sourceElementCtx.statement().exportStatement()) {
      const exportStatementCtx = sourceElementCtx.statement().exportStatement();
      this.visitExportStatement(exportStatementCtx, funct);
    }
  }

  /**
  * Traverses SourceElements in search of function definitions that are present in the YAML file to
  * generate corresponding code in fetch calls or Rabbit's WaitForCall.
  * @param {*} ctx - root of the semantic tree
  * @returns - generated code corresponding to the found functions
  */
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
