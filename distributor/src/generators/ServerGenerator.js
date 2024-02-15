import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./FunctionGenerator.js";
import fs from "fs";
import beautify from "js-beautify";

export default class ServerGenerator extends FunctionGenerator {
  constructor() {
    super();
    this.currentServerName = "";
    this.functionsImportedInsideServer = new Map();
    this.filesInitialized = [];
    this.waitForCallFunctionsInitialized = [];
  }

  /**
   * Gera codigo correspondente da rota get ou post fetch da funcao corrrespondente
   * @param {*} functionInfo - informacoes da funcao da rota
   */
  generateRouteCode(functionInfo) {
    if (functionInfo.method.toUpperCase() === 'GET') {
      this.appendString(`app.get('/${functionInfo.name}`);
      this.appendString("'")
      this.appendString(`,async (req, res) => {`);
    } else if (functionInfo.method.toUpperCase() === 'POST') {
      this.appendString(`app.post('/${functionInfo.name}', async (req, res) => {`);
    } 
    else if (functionInfo.method.toUpperCase() !== 'RABBIT') {
      console.error("Invalid method. It must be get, post or rabbit");
    }
  }

  /**
   * Determina se a função passada é async ou não
   * @param {*} functionInfo - informações da função que se deseja testar assincronidade
   * @param {*} functionDeclCtx - context da função sendo testada
   * @returns - true se funcao é async e false se não é
   */
  checkAsyncFunction(functionInfo, functionDeclCtx) {
    /* verifica se existe alguma outra função definida no yaml dentro do corpo da função
    testada; se existir, funcao testada pode fazer chamada para outra que esta em outro servidor
    e, portanto, é assincrona */
    for (let funct of this.functions) {
      if (funct.name !== functionInfo.name && 
          functionDeclCtx.functionBody().getText().includes(funct.name) &&
          funct.server !== this.currentServerName
          ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determina se uma anounymous arrow function sendo gerada é async ou não
   * @param {*} ctx - context da anounymous arrow function
   * @returns - true se assincrona ou false se sincrona
   */
  checkAsyncAnounymousArrowFunction(ctx) {
    let isAsync = false;
    if (ctx.arrowFunctionBody()) {
      // verifica se existe alguma função do yaml dentro do body da arrow function que não pertence
      // ao servidor atual; se existir, sua chamada é um fetch e portanto função é async
      for (let functionInfo of this.functions) {
        let functionServer = functionInfo.server;
        if (ctx.arrowFunctionBody().getText().includes(functionInfo.name) &&
          (functionServer !== this.currentServerName)) 
            isAsync = true;
      }
    }

    return isAsync;
  }

  /**
   * Determina se uma anounymous function sendo gerada é async ou não
   * @param {*} ctx - context da anounymous function
   * @returns - true se assincrona ou false se sincrona
   */
  checkAsyncAnounymousFunctionDecl(ctx) {
    let isAsync = false;
    if (ctx.functionBody()) {
      // verifica se existe alguma função do yaml dentro do body da arrow function que não pertence
      // ao servidor atual; se existir, sua chamada é um fetch e portanto função é async
      for (let functionInfo of this.functions) {
        let functionServer = functionInfo.server;
        if (ctx.functionBody().getText().includes(functionInfo.name) &&
          (functionServer !== this.currentServerName)) 
            isAsync = true;
      }
    }

    return isAsync;
  }

  /**
   * Verifica se uma dada função waitForCall já foi declarada no servidor
   * @param {*} waitForCallFunctionSearched - funcao waitForCall que se deseja testar
   * @returns - true caso waitForCall ja tenha sido declarado; false caso contrário
   */
  checkWaitForCallFunctionsInitialized(waitForCallFunctionSearched) {
    // verifica se waitForCall já foi inicializada dentro do mesmo arquivo de entrada ou de outro anterior
    return this.waitForCallFunctionsInitialized.includes(waitForCallFunctionSearched) ||
           this.checkWaitForCallFunctionsInitializedAux(waitForCallFunctionSearched);
  }

  /**
   * Verifica se dada waitForCall foi inicializada no servidor por outro arquivo de entrada anterior;
   * Para isso deve ler arquivo  
   * @param {*} waitForCallFunctionSearched - funcao waitForCall que se deseja testar
   * @returns - true caso waitForCall ja tenha sido declarado; false caso contrário
   */
  checkWaitForCallFunctionsInitializedAux(waitForCallFunctionSearched) {
    const waitForCallInvokedCode = `${waitForCallFunctionSearched}();`

    const filepath = `./src-gen/start-${this.currentServerName}.js`;
    
    // se arquivo do servidor atual existe e servidor ja foi inicializado (arquivos de entrada 
    // anteriores ja escreveram nele) testa se ja existe waitForCallInvokedCode
    if (fs.existsSync(filepath) && this.filesInitialized.includes(filepath)) { 
      try {
        // leitura do estado atual do servidor
        const code = fs.readFileSync(filepath, 'utf8');

        // testa se waitForCall ja foi definido no servidor
        if (code.includes(beautify(waitForCallInvokedCode, {
          indent_size: 4,
          space_in_empty_paren: true,
        }))) { 
          return true; // se tiver, return true
        } else return false; // se nao tiver, retorna false
      } catch(e) { 
        console.log(e);
        return; 
      }
    } 
    
    return false;
  }
  
  /**
   * Sobreescrita de visitFunctionDeclaration do copypaste para gerar código correspondente no servidor
   * para cada função do yaml
   * @param {*} ctx - context da função 
   */
  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find((func) => func.name === functionName);
    
    if (!functionInfo) console.error(`Função com nome "${functionName}" não encontrada no arquivo YAML.`);
    
    const isAsync = ctx.identifier().Async() !== null || this.checkAsyncFunction(functionInfo, ctx);
    const server = this.servers.find((s) => s.id === functionInfo.server);

    // se função sendo gerada for de método rabbitmq, retorna para não gerar nada
    if (functionInfo && 
        functionInfo.method.toUpperCase() === 'RABBIT' 
        && !this.checkWaitForCallFunctionsInitialized(`waitForCall${server.id}`)
    ) {
        const waitForCallFunction = `waitForCall${server.id}`; 

        this.appendString(`async function ${waitForCallFunction}() {`);
        this.appendString(`  const connection = await amqp.connect("${server.rabbitmq.connectionUrl || 'amqp://localhost'}");`);
        this.appendString(`  console.log("Esperando por chamadas");`);
        this.appendString(`  const channel = await connection.createChannel();`);
        this.appendString(`  let queueName = "${server.rabbitmq.queue}";`);
        this.appendString(`  await channel.assertQueue(queueName, { durable: false });`);
        this.appendString(`  channel.consume(`);
        this.appendString(`    queueName,`);
        this.appendString(`    async (msg) => {`);
        this.appendString(`      if (msg) {`);
        this.appendString(`        console.log("Recebendo chamada");`);
        this.appendString(`        const message = JSON.parse(msg.content.toString());`);

        // Loop pelas funcs associadas ao server
        for (const func of this.functions) {
          // se funcao nao for rabbit ou nao pertencer ao servidor, pula para proxima
          if(func.method.toUpperCase() !== 'RABBIT' || func.server !== server.id) continue;
          const parameters = func.parameters.map((param) => param.name).join(', ');

          this.appendString(`        if (message.funcName === "${func.name}" && message.type === "call") {`);
          this.appendString(`          const { ${parameters} } = message.parameters;`);
          this.appendString(`          console.log("Chamando função ${func.name}", ${parameters});`);
          this.appendString(`          const result${func.name} = await ${func.name}(${parameters});`);
          this.appendString(`          const response${func.name} = {`);
          this.appendString(`            funcName: "${func.name}",`);
          this.appendString(`            type: "response",`);
          this.appendString(`            result: result${func.name},`);
          this.appendString(`          };`);
          this.appendString(`          console.log("Enviando resposta para a função ${func.name}");`);
          this.appendString(`          channel.sendToQueue(queueName, Buffer.from(JSON.stringify(response${func.name})));`);
          this.appendString(`        }`);
        }

        this.appendString(`      }`);
        this.appendString(`    }, { noAck: true });`);
        this.appendString(`}`);
        this.appendNewLine();
        this.appendString(`waitForCall${server.id}();`);
        this.appendNewLine();

        this.waitForCallFunctionsInitialized.push(waitForCallFunction);
    } else if (functionInfo && functionInfo.method.toUpperCase() === 'GET' || functionInfo.method.toUpperCase() === 'POST') {

      // geracao do codigo da rota post ou get
      this.generateRouteCode(functionInfo);

      // parametros em rotas GET sao por query e POST por body
      const queryOrBody = functionInfo.method.toUpperCase() === 'POST' ? 'body' : 'query';

      // Processar parâmetros da função vindas do yaml
      functionInfo.parameters.forEach((param) => {
        this.appendString(`  const ${param.name} = req.${queryOrBody}.${param.name};`);
      });
      this.appendString();

      // gerando chamada da função original
      if (isAsync) this.appendString(`  const result = await ${functionName}(`);
      else this.appendString(`  const result = ${functionName}(`);
      const paramNames = functionInfo.parameters.map((param) => param.name).join(', ');
      this.appendString(`    ${paramNames}`);
      this.appendString(`  );`);
      this.appendString(`  return res.json({ result });`);
      this.appendString(`});`);
      this.appendString();

    }

    const paramNames = functionInfo.parameters.map((param) => param.name).join(', ');
    // cópia da função original que fica no servidor para ser chamada pela rota
    if(isAsync) this.appendString(`async function ${functionName}(${paramNames})`)
    else this.appendString(`function ${functionName}(${paramNames})`);
    if (ctx.functionBody()) {
      this.visitFunctionBody(ctx.functionBody());
    }
  }

  /**
   * Verifica se existem funções que devem ser importadas
   * @param {*} ctx - context de arguments expression
   */
  visitArgumentsExpression(ctx) {
    const functionName = ctx.children[0].getText();
    const functionInfo = this.functions.find((func) => func.name === functionName);
    
    // se função em arguments expression não for desse servidor ela é importada
    if (functionInfo && functionInfo.server !== this.currentServerName ) {
      this.generateImports(functionInfo, ctx.children[1]);
    }

    // para evitar await repetidos em funcoes async com chamada await
    if (functionInfo && !ctx.parentCtx.getText().includes("await") && functionInfo.server !== this.currentServerName)
      this.appendString("await ");      
    
    super.visitArgumentsExpression(ctx);
  }


  /**
   * Gera código correspondente no servidor para funções que estejam definidas com export no arquivo 
   * de entrada
   * @param {*} ctx - context do exportStatement
   * @param {*} funct - função do yaml que está sendo testada para verificar se está no exportStatement
   */
  visitExportStatement(ctx, funct) {
    const declarationCtx = ctx.declaration();
    // se exportStatement nao tiver declaration, não há o que gerar
    if (!declarationCtx) return;
    else if (declarationCtx.functionDeclaration() && ctx.declaration().functionDeclaration().identifier().getText() === funct.name) {
      this.currentFunction  = funct;
      this.currentServerName = funct.server;
      this.visitFunctionDeclaration(ctx.declaration().functionDeclaration());
      let newCode = this.codeGenerated.get(funct.server);
      if (!newCode) newCode = this.stringBuilder.toString();
      else  newCode += this.stringBuilder.toString();
      this.codeGenerated.set(funct.server, newCode);
      this.currentServerName = "";
    }
  }

  /**
   * Auxiliar para testar para testar se cada sourceElement é um pai de um exportStatement que pode
   * ser pai de uma declaração de função
   * @param {*} sourceElementCtx - context do sourceElement
   * @param {*} funct - função do yaml sendo testada
   */
  checkExportFunctionsDeclarations(sourceElementCtx, funct) {
    if (sourceElementCtx.statement().exportStatement()) {
      const exportStatementCtx = sourceElementCtx.statement().exportStatement();
      this.visitExportStatement(exportStatementCtx, funct);
    }
  }

  /**
   * Sobreescrita do visitAnonymousFunctionDecl para gerar código adaptado ao servidor 
   * @param {*} ctx - context do AnonymousFunctionDecl 
   */
  visitAnonymousFunctionDecl(ctx) {
    if (ctx.Async() || this.checkAsyncAnounymousFunctionDecl(ctx)) this.appendString("async ");
    this.appendTokens(ctx.Function_());
    if (ctx.children[0].getText().includes("*") || ctx.children[1].getText().includes("*")) this.appendString("*");
    this.appendString("(");
    if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Sobreescrita do visitArrowFunction para gerar código adaptado ao servidor
   * @param {*} ctx - context do arrowFunction
   */
  visitArrowFunction(ctx) {
    if (ctx.Async() || this.checkAsyncAnounymousArrowFunction(ctx)) this.appendString("async ");
    this.visitArrowFunctionParameters(ctx.arrowFunctionParameters());
    this.appendString(" => ");
    this.visitArrowFunctionBody(ctx.arrowFunctionBody());

  }
  
  /**
   * Verifica se determinado import que precisa ser feito já foi feito ou não
   * @param {*} importSearched - string com import sendo testado
   * @param {*} functionInfo - informações da função que se está sendo importada
   * @returns - true para double import, false para o contrário
   */
  checkDoubleImport(importSearched, functionInfo) {
    let isAlreadyImported = false;
    const functionsImported = this.functionsImportedInsideServer.get(this.currentServerName); 
    
    // verifica se função sendo importada já foi importada por arquivo de entrada sendo atualmente
    // gerado
    if (functionsImported) 
      isAlreadyImported = functionsImported.includes(functionInfo.name);

    // verifica se função sendo importada já foi importada também por outro arquivo de entrada 
    // anterior
    return isAlreadyImported || this.checkDoubleImportAux(importSearched);
  }

  /**
   * Auxiliar para verificar se import sendo feito já foi feito no servidor em execuções anteriores de 
   * arquivos de entradas anteriores
   * @param {*} importSearched - import buscado
   * @returns - true se import já feito, false caso contrário
   */
  checkDoubleImportAux(importSearched) {
    const filepath = `./src-gen/start-${this.currentServerName}.js`;
    
    // se arquivo do servidor atual existe e servidor ja foi inicializado (arquivos de entrada 
    // anteriores ja escreveram nele)
    if (fs.existsSync(filepath) && this.filesInitialized.includes(filepath)) { 
      try {
        // leitura do estado atual do servidor
        const code = fs.readFileSync(filepath, 'utf8');

        // testa se import sendo feito ja esta no servidor
        if (code.includes(beautify(importSearched, {
          indent_size: 4,
          space_in_empty_paren: true,
        }))) { 
          return true; // se tiver, return true
        } else return false; // se nao tiver, retorna false
      } catch(e) { 
        console.log(e);
        return; 
      }
    } 
    
    return false;
  }

  /**
   * Faz append do import necessário no começo do arquivo do servidor 
   * @param {*} functionInfo - informações da função sendo importada
   */
  generateImports(functionInfo) {
    const filename = `functions-${functionInfo.server}.js`;
    const importPath = `./${filename}`;
    let importCode = `import { ${functionInfo.name} } from "${importPath}";`;
  
    // verifica se import não está sendo duplicado
    if (!this.checkDoubleImport(importCode, functionInfo)) {
      // se já existe algum codigo gerado codigo do import deve se agrupar a ele
      if (this.codeGenerated.get(this.currentServerName)) importCode += this.codeGenerated.get(this.currentServerName);
      this.codeGenerated.set(this.currentServerName, importCode);
      this.functionsImportedInsideServer.set(this.currentServerName, functionInfo.name);
    }
  }

  /**
   * Percorre SourceElements em busca de definição de funções que se encontram no arquivo yaml para 
   * gerar então código correspondente no servidor cada função encontrada
   * @param {*} ctx - raiz da arvore semantica
   * @param {*} filesInitialized - array com nomes de arquivos de servidor ja inicializados
   * @returns - codigo gerado de servidores
   */
  generateFunctions(ctx, filesInitialized) {
    this.filesInitialized = filesInitialized;
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) { // percorre todos source elements
          if (sourceElements[i].statement().functionDeclaration() ||
              sourceElements[i].statement().exportStatement()) {
            // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            for (let funct of this.functions) { // busca de funcoes do yaml em sourceElement
              if (sourceElements[i].statement().functionDeclaration() && 
                  funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
                this.currentFunction  = funct;
                this.currentServerName = funct.server;
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
                let newCode = this.codeGenerated.get(funct.server);
                if (!newCode) newCode = this.stringBuilder.toString();
                else  newCode += this.stringBuilder.toString();
                this.codeGenerated.set(funct.server, newCode);
                this.currentServerName = "";
              } else if (sourceElements[i].statement().exportStatement()){
                this.checkExportFunctionsDeclarations(sourceElements[i], funct)
              }
            }
          }
      }   
    }
    return this.codeGenerated;
  }
}
