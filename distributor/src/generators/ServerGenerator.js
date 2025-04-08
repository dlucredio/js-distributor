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
   * Generates corresponding code of the get or post fetch route of the corresponding function
   * @param {*} functionInfo - information of the route function
   */
  generateRouteCode(functionInfo) {
    if (functionInfo.method.toUpperCase() === "GET") {
      this.appendString(`app.get('/${functionInfo.name}`);
      this.appendString("'");
      this.appendString(`,async (req, res) => {`);
    } else if (functionInfo.method.toUpperCase() === "POST") {
      this.appendString(
        `app.post('/${functionInfo.name}', async (req, res) => {`
      );
    } else if (functionInfo.method.toUpperCase() !== "RABBIT") {
      console.error("Invalid method. It must be get, post or rabbit");
    }
  }

  /**
   * Determines if the passed function is async or not
   * @param {*} functionInfo - information of the function to test asynchronicity
   * @param {*} functionDeclCtx - context of the function being tested
   * @returns - true if function is async and false otherwise
   */
  checkAsyncFunction(functionInfo, functionDeclCtx) {
    /* checks if there is another function defined in the yaml inside the body of the tested function;
  if there is, the tested function may make a call to another one that is in another server
  and, therefore, it is asynchronous */
    for (let funct of this.functions) {
      if (
        funct.name !== functionInfo.name &&
        functionDeclCtx.functionBody().getText().includes(funct.name) &&
        funct.server !== this.currentServerName
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines if a generated anonymous arrow function is async or not
   * @param {*} ctx - context of the anonymous arrow function
   * @returns - true if it's asynchronous or false if it's synchronous
   */
  checkAsyncAnounymousArrowFunction(ctx) {
    let isAsync = false;
    if (ctx.arrowFunctionBody()) {
      // checks if there is any yaml function inside the body of the arrow function that does not belong
      // to the current server; if there is, its call is a fetch and therefore the function is async
      for (let functionInfo of this.functions) {
        let functionServer = functionInfo.server;
        if (
          ctx.arrowFunctionBody().getText().includes(functionInfo.name) &&
          functionServer !== this.currentServerName
        )
          isAsync = true;
      }
    }

    return isAsync;
  }

  /**
   * Determines if a generated anonymous function is async or not
   * @param {*} ctx - context of the anonymous function
   * @returns - true if it's asynchronous or false if it's synchronous
   */
  checkAsyncAnounymousFunctionDecl(ctx) {
    let isAsync = false;
    if (ctx.functionBody()) {
      // checks if there is any yaml function inside the body of the arrow function that does not belong
      // to the current server; if there is, its call is a fetch and therefore the function is async
      for (let functionInfo of this.functions) {
        let functionServer = functionInfo.server;
        if (
          ctx.functionBody().getText().includes(functionInfo.name) &&
          functionServer !== this.currentServerName
        )
          isAsync = true;
      }
    }

    return isAsync;
  }

  /**
   * Checks if a given waitForCall function has already been declared in the server
   * @param {*} waitForCallFunctionSearched - waitForCall function to test
   * @returns - true if waitForCall has already been declared; false otherwise
   */
  checkWaitForCallFunctionsInitialized(waitForCallFunctionSearched) {
    // checks if waitForCall has already been initialized within the same input file or another previous one
    return (
      this.waitForCallFunctionsInitialized.includes(
        waitForCallFunctionSearched
      ) ||
      this.checkWaitForCallFunctionsInitializedAux(waitForCallFunctionSearched)
    );
  }

  /**
   * Checks if a given waitForCall has been initialized on the server by another previous input file;
   * To do this, it must read the file
   * @param {*} waitForCallFunctionSearched - waitForCall function to test
   * @returns - true if waitForCall has already been declared; false otherwise
   */
  checkWaitForCallFunctionsInitializedAux(waitForCallFunctionSearched) {
    const waitForCallInvokedCode = `${waitForCallFunctionSearched}();`;

    const filepath = `./src-gen/start-${this.currentServerName}.js`;

    // if current server file exists and server has been initialized (previous input files
    // have already written to it) test if waitForCallInvokedCode already exists
    if (fs.existsSync(filepath) && this.filesInitialized.includes(filepath)) {
      try {
        // reads the current state of the server
        const code = fs.readFileSync(filepath, "utf8");

        // tests if waitForCall has already been defined on the server
        if (
          code.includes(
            beautify(waitForCallInvokedCode, {
              indent_size: 4,
              space_in_empty_paren: true,
            })
          )
        ) {
          return true; // if it has, return true
        } else return false; // if it hasn't, return false
      } catch (e) {
        console.log(e);
        return;
      }
    }

    return false;
  }

  /**
   * Overwrite of visitFunctionDeclaration of the copypaste to generate corresponding code on the server
   * for each yaml function
   * @param {*} ctx - function context
   */
  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find(
      (func) => func.name === functionName
    );

    if (!functionInfo)
      console.error(
        `Function with name "${functionName}" not found in the YAML file.`
      );

    const isAsync =
      ctx.Async() !== null ||
      this.checkAsyncFunction(functionInfo, ctx);
    const server = this.servers.find((s) => s.id === functionInfo.server);

    // if the generated function is a rabbitmq method, return to generate nothing
    if (
      functionInfo &&
      functionInfo.method.toUpperCase() === "RABBIT" &&
      !this.checkWaitForCallFunctionsInitialized(`waitForCall${server.id}`)
    ) {
      const waitForCallFunction = `waitForCall${server.id}`;

      this.appendString(`async function ${waitForCallFunction}() {`);
      this.appendString(
        `  const connection = await amqp.connect("${server.rabbitmq.connectionUrl || "amqp://localhost"
        }");`
      );
      this.appendString(`  console.log("Waiting for calls");`);
      this.appendString(`  const channel = await connection.createChannel();`);
      this.appendString(`  let queueName = "${server.rabbitmq.queue}";`);
      this.appendString(
        `  await channel.assertQueue(queueName, { durable: false });`
      );
      this.appendString(`  channel.consume(`);
      this.appendString(`    queueName,`);
      this.appendString(`    async (msg) => {`);
      this.appendString(`      if (msg) {`);
      this.appendString(`        console.log("Receiving call");`);
      this.appendString(
        `        const message = JSON.parse(msg.content.toString());`
      );

      // Loop through the functions associated with the server
      for (const func of this.functions) {
        // if the function is not rabbit or does not belong to the server, skip to the next one
        if (func.method.toUpperCase() !== "RABBIT" || func.server !== server.id)
          continue;
        const parameters = func.parameters
          .map((param) => param.name)
          .join(", ");

        this.appendString(
          `        if (message.funcName === "${func.name}" && message.type === "call") {`
        );
        this.appendString(
          `          const { ${parameters} } = message.parameters;`
        );
        this.appendString(
          `          console.log("Calling function ${func.name}", ${parameters});`
        );
        this.appendString(
          `          const result${func.name} = await ${func.name}(${parameters});`
        );
        this.appendString(`          const response${func.name} = {`);
        this.appendString(`            funcName: "${func.name}",`);
        this.appendString(`            type: "response",`);
        this.appendString(`            result: result${func.name},`);
        this.appendString(`          };`);
        this.appendString(
          `          console.log("Sending response to function ${func.name}");`
        );
        this.appendString(
          `          channel.sendToQueue(queueName, Buffer.from(JSON.stringify(response${func.name})));`
        );
        this.appendString(`        }`);
      }

      this.appendString(`      }`);
      this.appendString(`    }, { noAck: true });`);
      this.appendString(`}`);
      this.appendNewLine();
      this.appendString(`waitForCall${server.id}();`);
      this.appendNewLine();

      this.waitForCallFunctionsInitialized.push(waitForCallFunction);
    } else if (
      (functionInfo && functionInfo.method.toUpperCase() === "GET") ||
      functionInfo.method.toUpperCase() === "POST"
    ) {
      // generation of the post or get route code
      this.generateRouteCode(functionInfo);

      // parameters in GET routes are by query and POST by body
      const queryOrBody =
        functionInfo.method.toUpperCase() === "POST" ? "body" : "query";

      // Processing function parameters from yaml
      functionInfo.parameters.forEach((param) => {
        this.appendString(
          `  const ${param.name} = req.${queryOrBody}.${param.name};`
        );
      });
      this.appendString();

      // generating call of the original function
      if (isAsync) this.appendString(`  const result = await ${functionName}(`);
      else this.appendString(`  const result = ${functionName}(`);
      const paramNames = functionInfo.parameters
        .map((param) => param.name)
        .join(", ");
      this.appendString(`    ${paramNames}`);
      this.appendString(`  );`);
      this.appendString(`  return res.json({ result });`);
      this.appendString(`});`);
      this.appendString();
    }

    const paramNames = functionInfo.parameters
      .map((param) => param.name)
      .join(", ");
    // copy of the original function that stays on the server to be called by the route
    if (isAsync)
      this.appendString(`async function ${functionName}(${paramNames})`);
    else this.appendString(`function ${functionName}(${paramNames})`);
    if (ctx.functionBody()) {
      this.visitFunctionBody(ctx.functionBody());
    }
  }

  /**
   * Checks if there are functions that should be imported
   * @param {*} ctx - arguments expression context
   */
  visitArgumentsExpression(ctx) {
    const functionName = ctx.children[0].getText();
    const functionInfo = this.functions.find(
      (func) => func.name === functionName
    );

    // if function in arguments expression is not from this server, it is imported
    if (functionInfo && functionInfo.server !== this.currentServerName) {
      this.generateImports(functionInfo, ctx.children[1]);
    }

    // to avoid repeated awaits in async functions with await call
    if (
      functionInfo &&
      !ctx.parentCtx.getText().includes("await") &&
      functionInfo.server !== this.currentServerName
    )
      this.appendString("await ");

    super.visitArgumentsExpression(ctx);
  }

  /**
   * Generates corresponding code in the server for functions defined with export in the input
   * file
   * @param {*} ctx - exportStatement context
   * @param {*} funct - function from yaml being tested to check if it is in the exportStatement
   */
  visitExportStatement(ctx, funct) {
    const declarationCtx = ctx.declaration();
    // if exportStatement doesn't have declaration, there's nothing to generate
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
    } else {
      const sourceElements = declarationCtx.functionDeclaration().functionBody().sourceElements().children;
      for (let i in sourceElements) {
        if (
          sourceElements[i].statement().functionDeclaration() ||
          sourceElements[i].statement().exportStatement()
        ) {
          this.stringBuilder = new StringBuilder();
          if (
            sourceElements[i].statement().functionDeclaration() &&
            funct.name ===
            sourceElements[i]
              .statement()
              .functionDeclaration()
              .identifier()
              .getText()
          ) {
            this.currentFunction = funct;
            this.currentServerName = funct.server;
            this.visitFunctionDeclaration(
              sourceElements[i].statement().functionDeclaration()
            );
            let newCode = this.codeGenerated.get(funct.server);
            if (!newCode) newCode = this.stringBuilder.toString();
            else newCode += this.stringBuilder.toString();
            this.codeGenerated.set(funct.server, newCode);
            this.currentServerName = "";
          } else if (sourceElements[i].statement().exportStatement()) {
            this.checkExportFunctionsDeclarations(sourceElements[i], funct);
          }
        }
      }
    }
  }

  /**
   * Helper function to test if each sourceElement is a parent of an exportStatement that can
   * be parent of a function declaration
   * @param {*} sourceElementCtx - sourceElement context
   * @param {*} funct - function from yaml being tested
   */
  checkExportFunctionsDeclarations(sourceElementCtx, funct) {
    if (sourceElementCtx.statement().exportStatement()) {
      const exportStatementCtx = sourceElementCtx.statement().exportStatement();
      this.visitExportStatement(exportStatementCtx, funct);
    }
  }

  /**
   * Overwrite of visitAnonymousFunctionDecl to generate adapted code for the server
   * @param {*} ctx - AnonymousFunctionDecl context
   */
  visitAnonymousFunctionDecl(ctx) {
    if (ctx.Async() || this.checkAsyncAnounymousFunctionDecl(ctx))
      this.appendString("async ");
    this.appendTokens(ctx.Function_());
    if (
      ctx.children[0].getText().includes("*") ||
      ctx.children[1].getText().includes("*")
    )
      this.appendString("*");
    this.appendString("(");
    if (ctx.formalParameterList())
      this.visitFormalParameterList(ctx.formalParameterList());
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Overwrite of visitArrowFunction to generate adapted code for the server
   * @param {*} ctx - arrowFunction context
   */
  visitArrowFunction(ctx) {
    if (ctx.Async() || this.checkAsyncAnounymousArrowFunction(ctx))
      this.appendString("async ");
    this.visitArrowFunctionParameters(ctx.arrowFunctionParameters());
    this.appendString(" => ");
    this.visitArrowFunctionBody(ctx.arrowFunctionBody());
  }

  /**
   * Checks if a certain import that needs to be done has already been done or not
   * @param {*} importSearched - string with import being tested
   * @param {*} functionInfo - information of the function that is being imported
   * @returns - true for double import, false otherwise
   */
  checkDoubleImport(importSearched, functionInfo) {
    let isAlreadyImported = false;
    const functionsImported = this.functionsImportedInsideServer.get(
      this.currentServerName
    );

    // checks if imported function has already been imported by the current input file
    if (functionsImported)
      isAlreadyImported = functionsImported.includes(functionInfo.name);

    // checks if imported function has already been imported by another previous input file
    return isAlreadyImported || this.checkDoubleImportAux(importSearched);
  }

  /**
   * Helper function to check if the import being made has already been done in previous executions
   * of previous input files in the server.
   * @param {*} importSearched - The import being searched.
   * @returns - True if the import has already been made, false otherwise.
   */
  checkDoubleImportAux(importSearched) {
    const filepath = `./src-gen/start-${this.currentServerName}.js`;

    // If the current server file exists and the server has already been initialized (previous input
    // files have already written to it)
    if (fs.existsSync(filepath) && this.filesInitialized.includes(filepath)) {
      try {
        const code = fs.readFileSync(filepath, "utf8");

        // Tests if the import being made is already present in the server
        if (
          code.includes(
            beautify(importSearched, {
              indent_size: 4,
              space_in_empty_paren: true,
            })
          )
        ) {
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
   * Appends the necessary import at the beginning of the server file.
   * @param {*} functionInfo - information about the function being imported
   */
  generateImports(functionInfo) {
    const filename = `functions-${functionInfo.server}.js`;
    const importPath = `./${filename}`;
    let importCode = `import { ${functionInfo.name} } from "${importPath}";`;

    // Verifies if the import is not being duplicated.
    if (!this.checkDoubleImport(importCode, functionInfo)) {
      // If the import already exists in the generated code, it will be grouped with it.
      if (this.codeGenerated.get(this.currentServerName))
        importCode += this.codeGenerated.get(this.currentServerName);
      this.codeGenerated.set(this.currentServerName, importCode);
      this.functionsImportedInsideServer.set(
        this.currentServerName,
        functionInfo.name
      );
    }
  }

  /**
   * Traverses SourceElements searching for function definitions present in the YAML file to generate
   * corresponding code on the server for each found function.
   * @param {*} ctx - root of the semantic tree
   * @param {*} filesInitialized - array containing names of already initialized server files
   * @returns - generated server code
   */
  generateFunctions(ctx, filesInitialized) {
    this.filesInitialized = filesInitialized;
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (
          sourceElements[i].statement().functionDeclaration() ||
          sourceElements[i].statement().exportStatement()
        ) {
          this.stringBuilder = new StringBuilder();
          for (let funct of this.functions) {
            if (
              sourceElements[i].statement().functionDeclaration() &&
              funct.name ===
              sourceElements[i]
                .statement()
                .functionDeclaration()
                .identifier()
                .getText()
            ) {
              this.currentFunction = funct;
              this.currentServerName = funct.server;
              this.visitFunctionDeclaration(
                sourceElements[i].statement().functionDeclaration()
              );
              let newCode = this.codeGenerated.get(funct.server);
              if (!newCode) newCode = this.stringBuilder.toString();
              else newCode += this.stringBuilder.toString();
              this.codeGenerated.set(funct.server, newCode);
              this.currentServerName = "";
            } else if (sourceElements[i].statement().exportStatement()) {
              this.checkExportFunctionsDeclarations(sourceElements[i], funct);
            }
          }
        }
      }
    }
    return this.codeGenerated;
  }

  /**
   * Traverses SourceElements searching for function definitions present in the YAML file to determine
   * if they should be present in the given server
   * @param {*} ctx - root of the semantic tree
   * @param {*} serverName - the server to be checked
   * @param {*} config - the configuration loaded from the YAML file
   * @returns - true if this visitor encounters a function that is present in the given server, false otherwise
   */
  hasFunctionInServer(ctx, serverName, config) {
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (sourceElements[i].statement().functionDeclaration() ||
          sourceElements[i].statement().exportStatement()) {
          for (let funct of config.functions) {
            if (
              sourceElements[i].statement().functionDeclaration() &&
              funct.name ===
              sourceElements[i]
                .statement()
                .functionDeclaration()
                .identifier()
                .getText() &&
              funct.server === serverName
            ) {
              return true;
            } else if (sourceElements[i].statement().exportStatement() &&
              sourceElements[i].statement().exportStatement().declaration() &&
              sourceElements[i].statement().exportStatement().declaration().functionDeclaration() &&
              funct.name ===
              sourceElements[i].statement().exportStatement().declaration().functionDeclaration().identifier().getText() &&
              funct.server === serverName) {
              return true;

            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Checks if the given function is present in the config. This is used to avoid generating an import for
   * a function that will be imported by the generated code.
   * @param {*} functionName - the name of the function to check
   * @param {*} config - the configuration loaded from the YAML file
   * @returns - true if this function is part of the config file, false otherwise
   */
  isAFunctionFromConfigFile(functionName, config) {
    for (let funct of config.functions) {
      if (funct.name === functionName) {
        return true;
      }
    }
    return false;
  }

  /**
   * Traverses SourceElements searching for all elements that are not function definitions present in the YAML file to generate
   * corresponding code on each server. These elements are, possibly, required imports, constants and other functions.
   * TODO: We could change this function to generate code for functions too, if they do not appear in the config file,
   * but this requires some studying
   * @param {*} fileName - the file where to look for the elements
   * @param {*} ctx - root of the semantic tree
   * @param {*} serverName - the server for which code is being generated
   * @param {*} config - the configuration loaded from the YAML file
   * @returns - generated server code for all elements except functions
   */
  generateGlobalElements(fileName, ctx, serverName, config) {
    // this.stringBuilder.appendNewLine();
    // this.stringBuilder.append(`// Scanning global elements in ${fileName} for ${serverName}\n`);
    if (ctx.sourceElements() && this.hasFunctionInServer(ctx, serverName, config)) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
        if (!(
          sourceElements[i].statement().functionDeclaration() ||
          sourceElements[i].statement().exportStatement()
        )) {
          const stmt = sourceElements[i].statement();
          if (stmt.importStatement() &&
            stmt.importStatement().importFromBlock() &&
            stmt.importStatement().importFromBlock().importModuleItems()) {
            const importFrom = stmt.importStatement().importFromBlock().importFrom().StringLiteral().getText();
            const importedModuleItems = stmt.importStatement().importFromBlock().importModuleItems();
            for (let importAliasName of importedModuleItems.importAliasName()) {
              const moduleExportName = importAliasName.moduleExportName();
              const importedBinding = importAliasName.importedBinding();
              if (!importedBinding) {
                if (!this.isAFunctionFromConfigFile(moduleExportName.getText(), config)) {
                  this.stringBuilder.append(`\nimport { ${moduleExportName.getText()} } from ${importFrom};\n`);
                }
              } else {
                if (!this.isAFunctionFromConfigFile(importedBinding.getText(), config)) {
                  this.stringBuilder.append(`\nimport { ${moduleExportName.getText()} as ${importedBinding.getText()} } from ${importFrom};\n`);
                }
              }
            }
          } else {
            this.visitSourceElement(sourceElements[i].statement());
          }
        }
      }
    }
    // this.stringBuilder.appendNewLine();
    // this.stringBuilder.append(`// End of global elements in ${fileName} for ${serverName}\n`);
    return this.stringBuilder.toString();
  }
}
