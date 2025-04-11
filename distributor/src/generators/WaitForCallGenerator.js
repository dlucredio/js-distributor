import { StringBuilder } from "./GeneratorUtils.js";
import FunctionGenerator from "./FunctionGenerator.js";
import config from "../config/Configuration.js";
import fs from "fs";
import beautify from "js-beautify";

/**
 * Classe que gera código para aguardar chamadas de função RabbitMQ.
 */
export default class WaitForCallGenerator extends FunctionGenerator {
  /**
   * Construtor da classe WaitForCallGenerator.
   */
  constructor() {
    super();
    this.functionMap = this.buildFunctionMap(config.functions);
    this.functionsImportedInsideServer = new Set();
    this.filesInitialized = [];
  }

  /**
   * Constrói um mapa de funções associadas a servidores.
   * @param {Array} functions - Array de objetos de função.
   * @returns {Object} - O mapa de funções associadas a servidores.
   */
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
   * Gera os imports necessários para as funções associadas ao servidor.
   * @param {Object} functionInfo - Informações sobre a função.
   */
  generateImports(functionInfo) {
    const filename = `../src-gen/abc.js`;
    const importPath = `./${filename}`;
    const importCode = `import { ${functionInfo.name} } from "${importPath}";`;

    // Verificar se a importação já foi adicionada
    if (!this.functionsImportedInsideServer.has(functionInfo.server)) {
      // Se não foi adicionada, adicione agora
      this.appendString(importCode);
      this.functionsImportedInsideServer.add(functionInfo.server);
    }
  }

  /**
   * Verifica se a importação já foi feita para evitar importações duplicadas.
   * @param {string} importSearched - Código de importação a ser verificado.
   * @returns {boolean} - True se a importação já foi feita, caso contrário, false.
   */
  checkDoubleImportAux(importSearched) {
    const filepath = `./src-gen/start-${this.currentServerName}.js`;

    if (fs.existsSync(filepath) && this.filesInitialized.includes(filepath)) {
      try {
        const code = fs.readFileSync(filepath, 'utf8');

        if (code.includes(beautify(importSearched, {
          indent_size: 4,
          space_in_empty_paren: true,
        }))) {
          return true;
        } else return false;
      } catch (e) {
        console.log(e);
        return;
      }
    }

    return false;
  }

  /**
   * Visita a declaração de uma função e gera o código correspondente para esperar chamadas.
   * @param {Object} ctx - Contexto da declaração da função (Árvore).
   */
  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = config.functions.find((func) => func.name === functionName);

    if (functionInfo.method.toUpperCase() !== 'RABBIT') return;
    if (functionInfo) {
      const server = config.servers.find((s) => s.id === functionInfo.server && functionInfo.method.toUpperCase() === 'RABBIT');

      if (!server) return;
      if (server) {
        for (const func of this.functionMap[server.id]) {
          this.generateImports(func);
        }

        this.appendNewLine();

        for (const func of this.functionMap[server.id]) {
          const importCode = `import { ${func.name} } from "./functions-${func.server}.js";`;
          if (func.method.toUpperCase() === 'RABBIT' && !this.checkDoubleImportAux(importCode))
            this.appendString(importCode);
        }
        this.appendNewLine();
        this.appendString(`async function waitForCall${server.id}() {`);
        this.appendString(`  const connection = await amqp.connect("${server.rabbitmq.connectionUrl || 'amqp://localhost'}");`);
        this.appendString(`  console.log("Waiting for calls");`);
        this.appendString(`  const channel = await connection.createChannel();`);
        this.appendString(`  let queueName = "${server.rabbitmq.queue}";`);
        this.appendString(`  await channel.assertQueue(queueName, { durable: false });`);
        this.appendString(`  channel.consume(`);
        this.appendString(`    queueName,`);
        this.appendString(`    async (msg) => {`);
        this.appendString(`      if (msg) {`);
        this.appendString(`        console.log("Receiving call");`);
        this.appendString(`        const message = JSON.parse(msg.content.toString());`);

        for (const func of this.functionMap[server.id]) {
          if (func.method.toUpperCase() !== 'RABBIT') continue;
          const parameters = func.parameters.map((param) => param.name).join(', ');

          this.appendString(`        if (message.funcName === "${func.name}" && message.type === "call") {`);
          this.appendString(`          const { ${parameters} } = message.parameters;`);
          this.appendString(`          console.log("Calling function ${func.name}", ${parameters});`);
          this.appendString(`          const result${func.name} = await ${func.name}(${parameters});`);
          this.appendString(`          const response${func.name} = {`);
          this.appendString(`            funcName: "${func.name}",`);
          this.appendString(`            type: "response",`);
          this.appendString(`            result: result${func.name},`);
          this.appendString(`          };`);
          this.appendString(`          console.log("Sending response to function ${func.name}");`);
          this.appendString(`          channel.sendToQueue(queueName, Buffer.from(JSON.stringify(response${func.name})));`);
          this.appendString(`        }`);
        }

        this.appendString(`      }`);
        this.appendString(`    }, { noAck: true });`);
        this.appendString(`}`);
        this.appendNewLine();
        this.appendString(`waitForCall${server.id}();`);
        this.appendNewLine();
      } else {
        console.error(`Server not found for function: ${functionName}`);
      }
    } else {
      console.error(`Function not found: ${functionName}`);
    }
  }

  /**
   * Gera o código correspondente para as funções RabbitMQ.
   * @param {Object} ctx - Contexto do programa (Árvore).
   * @param {Array} filesInitialized - Arquivos inicializados.
   * @returns {Map} - Mapa de códigos gerados.
   */
  generateFunctions(ctx, filesInitialized) {
    this.visitProgram(ctx);
    this.filesInitialized = filesInitialized;
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (sourceElements[i].statement().functionDeclaration()) {
          this.stringBuilder = new StringBuilder();
          for (let funct of config.functions) {
            if (funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
              const serverInfo = config.servers.find((server) => server.id === funct.server);
              if (!this.codeGenerated.has(funct.server) && funct.method.toUpperCase() === 'RABBIT') {
                this.currentServerName = funct.server;
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
                let newCode = this.stringBuilder.toString();
                let existingCode = this.codeGenerated.get(funct.server);
                if (existingCode) {
                  newCode = existingCode + newCode;
                }
                this.codeGenerated.set(funct.server, newCode);
                this.currentServerName = "";
              }
            }
          }
        }
      }
    }
    return this.codeGenerated;
  }
}
