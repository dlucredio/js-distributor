import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./FunctionGenerator.js";
var amqpImportAdded = false;
export default class RabbitMQGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.functionMap = this.buildFunctionMap(this.functions);
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
    const server = this.servers.find((s) => s.id === functionInfo.server);
    const paramNames = functionInfo.parameters
      .map((param) => param.name)
      .join(", ");
    const connectionUrl = server.rabbitmq.connectionUrl || "amqp://localhost";


    this.appendString(`import amqp from 'amqplib';`);
    for (const func of this.functionMap[server.id]) {
      this.appendString(`export{${func.name}};`);
    
    if (functionInfo) {
      const exchange = server.rabbitmq.exchange;
      const queue = server.rabbitmq.queue;

      // publish
      this.appendString(`async function ${functionName}(${paramNames}) {`);
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
      this.appendString(`      let queueName = "${queue}";`);
      this.appendString(`      console.log("Declarando fila: ${queue}");`);
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
        `      console.log("Enviando mensagem para a fila: ${queue}");`
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
  }
  generateFunctions(ctx) {
    this.visitProgram(ctx);
    this.codeGenerated.set("allfunctions", this.stringBuilder.toString());

    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (sourceElements[i].statement().functionDeclaration()) {
          // reinicio de stringBuilder
          this.stringBuilder = new StringBuilder();
          for (let funct of this.functions) {
            if (funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
              // Verifica se o código para este servidor já foi gerado
              if (!this.codeGenerated.has(funct.server)) {
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
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
