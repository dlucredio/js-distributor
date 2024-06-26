import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./FunctionGenerator.js";
var amqpImportAdded = false;

export default class RabbitMQGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.functionMap = this.buildFunctionMap(this.functions);
    this.functionDeclared = {};
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

  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find(
      (func) => func.name === functionName
    );
    const server = this.servers.find(
      (s) =>
        s.id === functionInfo.server && functionInfo.method.toUpperCase() === 'RABBIT'
    );
    if (functionInfo.method.toUpperCase() !== "RABBIT" || !server) return;

    const paramNames = functionInfo.parameters
      .map((param) => param.name)
      .join(", ");
    const connectionUrl = server.rabbitmq.connectionUrl || "amqp://localhost";

    if (!this.functionDeclared[server.id]) {
      this.appendString(`import amqp from 'amqplib';`);
      for (const func of this.functionMap[server.id]) {
        if (func.method.toUpperCase() === "RABBIT") {
          this.appendString(`export { ${func.name} };`);
        }
      }
      this.functionDeclared[server.id] = true;
    }

    this.appendString(`async function ${functionName}(${paramNames}) {`);
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
    this.appendString(`      let queueName = "${server.rabbitmq.queue}";`);
    this.appendString(`      console.log("Declaring queue: ${server.rabbitmq.queue}");`);
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
      `            console.log("Receiving response for function ${functionName}");`
    );
    this.appendString(
      `            if (message.funcName === "${functionName}" && message.type === "response") {`
    );
    this.appendString(`              const result = message.result;`);
    this.appendString(
      `              console.log("Response received:", result);`
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
      `      console.log("Sending message to queue: ${server.rabbitmq.queue}");`
    );
    this.appendString(
      `      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));`
    );
    this.appendString(`    } catch (error) {`);
    this.appendString(
      `      console.error("Error processing call to function ${functionName}:", error);`
    );
    this.appendString(`      reject(error);`);
    this.appendString(`    }`);
    this.appendString(`  });`);
    this.appendString(`  return p;`);
    this.appendString(`}`);
    this.appendNewLine();
  }
  
  generateFunctions(ctx, filesInitialized) {
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (sourceElements[i].statement().functionDeclaration()) {
          this.stringBuilder = new StringBuilder();
          for (let funct of this.functions) {
            if (
              funct.name ===
              sourceElements[i].statement().functionDeclaration().identifier().getText()
            ) {
              if (!this.codeGenerated.has(funct.server)) {
                this.visitFunctionDeclaration(
                  sourceElements[i].statement().functionDeclaration()
                );
                let newCode = this.stringBuilder.toString();
                let existingCode = this.codeGenerated.get(funct.server);
                if (existingCode) {
                  newCode = existingCode + newCode;
                }
                this.codeGenerated.set(funct.server, newCode);
              }
            }
          }
        }
      }
    }
    return this.codeGenerated;
  }
}
