import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";
import { StringBuilder } from "./generator-utils.js";

/**
  Class that generates copy-pasted code.
*/
export default class CopyPasteGenerator extends JavaScriptParserVisitor {
  /**
  Constructor of the CopyPasteGenerator class.
*/
  constructor() {
    super();
    this.stringBuilder = new StringBuilder();
  }

  /**
   * Adds tokens to the StringBuilder.
   * @param {Object} token - Token to be added.
   */
  appendTokens(token) {
    if (token) {
      this.stringBuilder.append(token.getText());
    }
  }

  /**
   * Adds a string to the StringBuilder.
   * @param {string} str - String to be added.
   */
  appendString(str) {
    if (str) {
      this.stringBuilder.append(str);
    }
  }

  /**
   * Add a new line to StringBuilder.
   */
  appendNewLine() {
    this.stringBuilder.append("\n");
  }

  /**
   * Visit the program.
   * @param {Object} ctx - Context of the program.
   */
  visitProgram(ctx) {
    this.appendTokens(ctx.HashBangLine());
    if (ctx.sourceElements()) {
      this.visitSourceElements(ctx.sourceElements());
    }
  }

  /**
   * Visit a block.
   * @param {Object} ctx - Context of a block.
   */
  visitBlock(ctx) {
    this.appendString("{");
    if (ctx.statementList()) {
      this.visitStatementList(ctx.statementList());
    }
    this.appendString("}");
  }

  /**
   * Visits an import statement.
   * @param {Object} ctx - Context of the import statement.
   */
  visitImportStatement(ctx) {
    this.appendString("import ");
    this.visitImportFromBlock(ctx.importFromBlock());
  }

  /**
   * Visits an import block.
   * @param {Object} ctx - Context of the import block.
   */
  visitImportFromBlock(ctx) {
    if (ctx.importFrom()) {
      if (ctx.importDefault()) {
        this.visitImportDefault(ctx.importDefault());
      }
      if (ctx.importNamespace()) {
        this.visitImportNamespace(ctx.importNamespace());
      } else {
        this.visitImportModuleItems(ctx.importModuleItems());
      }
      this.visitImportFrom(ctx.importFrom());
    } else {
      this.appendTokens(ctx.StringLiteral());
    }
    this.appendString(";");
    this.appendNewLine();
  }

  /**
   * Visits the items of the import module.
   * @param {Object} ctx - Context of the import module items.
   */
  visitImportModuleItems(ctx) {
    this.appendString("{");
    for (let i = 0; i < ctx.importAliasName().length; i++) {
      this.visitImportAliasName(ctx.importAliasName(i));

      if (i == ctx.importAliasName().length - 1) break;
      this.appendString(",");
    }

    this.appendString("}");
  }

  /**
   * Visits an import alias name.
   * @param {Object} ctx - Context of the import alias name.
   */
  visitImportAliasName(ctx) {
    this.visitModuleExportName(ctx.moduleExportName());
    if (ctx.importedBinding()) {
      this.appendString(" as ");
      this.visitImportedBinding(ctx.importedBinding());
    }
  }

  /**
   * Visits a module export name.
   * @param {Object} ctx - Context of the module export name.
   */
  visitModuleExportName(ctx) {
    ctx.identifierName()
      ? this.appendString(ctx.identifierName().getText())
      : this.appendString(ctx.StringLiteral().getText());
  }

  /**
   * Visits an import alias.
   * @param {Object} ctx - Context of the import alias.
   */
  visitImportedBinding(ctx) {
    if (ctx.Identifier()) this.appendString(ctx.Identifier().getText());
    else if (ctx.Yield()) this.appendString(ctx.Yield().getText());
    else if (ctx.Await()) this.appendString(ctx.Await().getText());
  }

  /**
   * Visits an identifier name.
   * @param {Object} ctx - Context of the identifier name.
   */
  visitIdentifierName(ctx) {
    this.appendString(ctx.getText());
  }

  /**
   * Visits a default import.
   * @param {Object} ctx - Context of the default import.
   */
  visitImportDefault(ctx) {
    this.visitAliasName(ctx.aliasName());
    this.appendString(", ");
  }

  /**
   * Visits an alias name.
   * @param {Object} ctx - Context of the alias name.
   */
  visitAliasName(ctx) {
    this.visitIdentifierName(ctx.identifierName(0));
    if (ctx.identifierName(1)) {
      this.appendString(" as ");
      this.visitIdentifierName(ctx.identifierName(1));
    }
  }

  /**
   * Visit an import namespace.
   * @param {Object} ctx - Context of the import namespace.
   */
  visitImportNamespace(ctx) {
    if (ctx.getText().includes("*")) {
      this.appendString(" * ");
      if (ctx.identifierName(0)) {
        this.appendString(" as ");
        this.visitIdentifierName(ctx.identifierName(0));
      }
    } else {
      this.visitIdentifierName(ctx.identifierName(0));
      if (ctx.identifierName(1)) {
        this.appendString(" as ");
        this.visitIdentifierName(ctx.identifierName(1));
      }
    }
  }

  /**
   * Visit an import statement.
   * @param {Object} ctx - Context of the import statement.
   */
  visitImportFrom(ctx) {
    this.appendString(" from ");
    this.appendString(ctx.StringLiteral().getText());
  }

  /**
   * Visit an export declaration.
   * @param {Object} ctx - Context of the export declaration.
   */
  visitExportDeclaration(ctx) {
    this.appendString("export ");
    if (ctx.Default()) this.appendString(" default ");
    if (ctx.exportFromBlock()) {
      this.visitExportFromBlock(ctx.exportFromBlock());
      this.appendString(";");
    }
    // Do not add ';' since visitDeclaration will add it
    else if (ctx.declaration()) this.visitDeclaration(ctx.declaration());
  }

  /**
   * Visit a default export declaration.
   * @param {Object} ctx - Context of the default export declaration.
   */
  visitExportDefaultDeclaration(ctx) {
    this.appendString("export ");
    this.appendString(" default ");
    this.visitChildren(ctx);
    this.appendString(";");
  }

  /**
   * Visit a module export block.
   * @param {Object} ctx - Context of the module export block.
   */
  visitExportFromBlock(ctx) {
    if (ctx.importNamespace()) {
      this.visitImportNamespace(ctx.importNamespace());
      this.visitImportFrom(ctx.importFrom());
    } else {
      this.visitExportModuleItems(ctx.exportModuleItems());
      if (ctx.importFrom()) this.visitImportFrom(ctx.importFrom());
    }
  }

  /**
   * Visit module export items.
   * @param {Object} ctx - Context of the module export items.
   */
  visitExportModuleItems(ctx) {
    this.appendString("{ ");
    for (let i = 0; i < ctx.exportAliasName().length; i++) {
      this.visitExportAliasName(ctx.exportAliasName(i));

      if (i !== ctx.exportAliasName().length - 1) this.appendString(", ");
    }
    this.appendString("}");
  }

  /**
   * Visit an export alias name.
   * @param {Object} ctx - Context of the export alias name.
   */
  visitExportAliasName(ctx) {
    this.visitModuleExportName(ctx.moduleExportName(0));
    if (ctx.moduleExportName(1)) {
      this.appendString(" as ");
      this.visitModuleExportName(ctx.moduleExportName(1));
    }
  }

  /**
   * Visits a function property.
   * @param {Object} ctx - Context of the function property.
   */
  visitFunctionProperty(ctx) {
    if (ctx.Async()) this.appendString("async ");
    if (
      ctx.children[0].getText().includes("*") ||
      ctx.children[1].getText().includes("*")
    )
      this.appendString("*");
    this.visitPropertyName(ctx.propertyName());
    this.appendString("( ");
    if (ctx.formalParameterList())
      this.visitFormalParameterList(ctx.formalParameterList());
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Visits a function declaration.
   * @param {Object} ctx - Context of the function declaration.
   */
  visitFunctionDeclaration(ctx) {
    if (ctx.Async()) this.appendString("async ");
    this.appendString("function ");
    if (
      ctx.children[1].getText().includes("*") ||
      ctx.children[2].getText().includes("*")
    )
      this.appendString("*");
    this.appendString(ctx.identifier().getText());
    this.appendString("(");
    if (ctx.formalParameterList())
      this.visitFormalParameterList(ctx.formalParameterList());
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Visits an anonymous function declaration.
   * @param {Object} ctx - Context of the anonymous function declaration.
   */
  visitAnonymousFunctionDecl(ctx) {
    if (ctx.Async()) this.appendTokens(ctx.Async());
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
   * Visits an arrow function.
   * @param {Object} ctx - Context of the arrow function.
   */
  visitArrowFunction(ctx) {
    if (ctx.Async()) this.appendTokens(ctx.Async());
    this.visitArrowFunctionParameters(ctx.arrowFunctionParameters());
    this.appendString(" => ");
    this.visitArrowFunctionBody(ctx.arrowFunctionBody());
  }

  /**
   * Visits arrow function parameters.
   * @param {Object} ctx - Context of the arrow function parameters.
   */
  visitArrowFunctionParameters(ctx) {
    if (ctx.identifier()) this.appendTokens(ctx.identifier());
    else {
      this.appendString("( ");
      if (ctx.formalParameterList())
        this.visitFormalParameterList(ctx.formalParameterList());
      this.appendString(" ) ");
    }
  }

  /**
   * Visits the formal parameter list.
   * @param {Object} ctx - Context of the formal parameter list.
   */
  visitFormalParameterList(ctx) {
    if (ctx.formalParameterArg().length !== 0) {
      for (let i = 0; i < ctx.formalParameterArg().length; i++) {
        this.visitFormalParameterArg(ctx.formalParameterArg(i));
        if (i !== ctx.formalParameterArg().length - 1) this.appendString(", ");
      }

      if (ctx.lastFormalParameterArg()) {
        this.appendString(",");
        this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
      }
    } else {
      this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
    }
  }

  /**
   * Visits a formal parameter argument.
   * @param {Object} ctx - Context of the formal parameter argument.
   */
  visitFormalParameterArg(ctx) {
    this.visitAssignable(ctx.assignable());
    if (ctx.children.length > 1) {
      this.appendString(" = ");
      this.visit(ctx.children[2]);
    }
  }

  /**
   * Visits an assignable context.
   * @param {Object} ctx - Context of the assignable.
   */
  visitAssignable(ctx) {
    if (ctx.identifier()) this.visitIdentifier(ctx.identifier());
    else this.visitChildren(ctx);
  }

  /**
   * Visits an array literal.
   * @param {Object} ctx - Context of the array literal.
   */
  visitArrayLiteral(ctx) {
    this.appendString("[ ");
    this.visitElementList(ctx.elementList());
    this.appendString("] ");
  }

  /**
   * Visits an object literal.
   * @param {Object} ctx - Context of the object literal.
   */
  visitObjectLiteral(ctx) {
    this.appendString("{ ");

    for (let i = 1; i < ctx.children.length - 1; i++) {
      this.visit(ctx.children[i]);
      if (
        i !== ctx.children.length - 2 &&
        !ctx.children[i].getText().includes(",")
      )
        this.appendString(", ");
    }
    this.appendString("}");
  }

  /**
   * Visits a property expression assignment.
   * @param {Object} ctx - Context of the property expression assignment.
   */
  visitPropertyExpressionAssignment(ctx) {
    this.visitPropertyName(ctx.propertyName());
    this.appendString(": ");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits an element list.
   * @param {Object} ctx - Context of the element list.
   */
  visitElementList(ctx) {
    for (let i = 0; i < ctx.arrayElement().length; i++) {
      this.visitArrayElement(ctx.arrayElement(i));
      if (i !== ctx.arrayElement().length - 1) this.appendString(", ");
    }
  }

  /**
   * Visits an array element.
   * @param {Object} ctx - Context of the array element.
   */
  visitArrayElement(ctx) {
    if (ctx.Ellipsis()) this.appendTokens(ctx.Ellipsis());
    this.visitChildren(ctx);
  }

  /**
   * Visits the last formal parameter argument.
   * @param {Object} ctx - Context of the last formal parameter argument.
   */
  visitLastFormalParameterArg(ctx) {
    this.appendTokens(ctx.Ellipsis());
    this.visitChildren(ctx);
  }

  /**
   * Visits a function body.
   * @param {Object} ctx - Context of the function body.
   */
  visitFunctionBody(ctx) {
    this.appendString("{ ");
    if (ctx.sourceElements()) this.visitSourceElement(ctx.sourceElements());
    this.appendString("} ");
  }

  /**
   * Visits a class declaration.
   * @param {Object} ctx - Context of the class declaration.
   */
  visitClassDeclaration(ctx) {
    this.appendString("class ");
    this.appendString(ctx.identifier().getText());
    this.visitClassTail(ctx.classTail());
  }

  /**
   * Visits a class expression.
   * @param {Object} ctx - Context of the class expression.
   */
  visitClassExpression(ctx) {
    this.appendString("class ");
    if (ctx.identifier()) this.visitIdentifier(ctx.identifier());
    this.visitClassTail(ctx.classTail());
  }

  /**
   * Visits the tail of a class.
   * @param {Object} ctx - Context of the class tail.
   */
  visitClassTail(ctx) {
    if (ctx.Extends()) {
      this.appendString(" extends ");
      this.visit(ctx.children[1]);
    }
    this.appendString("{");
    for (let i = 0; i < ctx.classElement().length; i++) {
      this.visitClassElement(ctx.classElement(i));
    }
    this.appendString("}");
  }

  /**
   * Visits a class element.
   * @param {Object} ctx - Context of the class element.
   */
  visitClassElement(ctx) {
    if (ctx.emptyStatement_()) {
      this.appendString(";");
    } else if (ctx.propertyName()) {
      if (ctx.children.length === 4) this.appendString("#");
      this.visitPropertyName(ctx.propertyName());
      this.appendString(" = ");
      this.visit(ctx.children[ctx.children.length - 1]);
    } else {
      for (const tk of ctx.Static()) {
        this.appendString(tk.getText() + " ");
      }
      for (const tk of ctx.identifier()) {
        this.appendString(tk.getText() + " ");
      }
      for (const tk of ctx.Async()) {
        this.appendString(tk.getText() + " ");
      }
      if (ctx.methodDefinition()) {
        this.visitMethodDefinition(ctx.methodDefinition());
      } else {
        this.visitAssignable(ctx.assignable());
        this.appendString(" = ");
        this.visitObjectLiteral(ctx.objectLiteral());
        this.appendString(";");
      }
    }
  }

  /**
   * Visits a method definition.
   * @param {Object} ctx - Context of the method definition.
   */
  visitMethodDefinition(ctx) {
    if (ctx.children[0].getText().includes("*")) this.appendString("*");
    if (
      ctx.children[0].getText().includes("#") ||
      ctx.children[1].getText().includes("#")
    )
      this.appendString("#");
    if (ctx.propertyName()) {
      this.visitPropertyName(ctx.propertyName());
      this.appendString("(");
      if (ctx.formalParameterList())
        this.visitFormalParameterList(ctx.formalParameterList());
      this.appendString(")");
    } else if (ctx.getter()) {
      this.visitGetter(ctx.getter());
      this.appendString("(");
      this.appendString(")");
    } else {
      this.visitSetter(ctx.setter());
      this.appendString("(");
      if (ctx.formalParameterList())
        this.visitFormalParameterList(ctx.formalParameterList());
      this.appendString(")");
    }
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Visits a getter method.
   * @param {Object} ctx - Context of the getter method.
   */
  visitGetter(ctx) {
    this.appendString("get ");
    this.visitPropertyName(ctx.propertyName());
  }

  /**
   * Visits a computed property expression assignment.
   * @param {Object} ctx - Context of the computed property expression assignment.
   */
  visitComputedPropertyExpressionAssignment(ctx) {
    this.appendString("[");
    this.visit(ctx.children[1]);
    this.appendString("]");
    this.appendString(":");
    this.visit(ctx.children[4]);
  }

  /**
   * Visits a property getter.
   * @param {Object} ctx - Context of the property getter.
   */
  visitPropertyGetter(ctx) {
    this.visitGetter(ctx.getter());
    this.appendString("(");
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Visits a property setter.
   * @param {Object} ctx - Context of the property setter.
   */
  visitPropertySetter(ctx) {
    this.visitSetter(ctx.setter());
    this.appendString("(");
    this.visitFormalParameterArg(ctx.formalParameterArg());
    this.appendString(")");
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Visits a property shorthand.
   * @param {Object} ctx - Context of the property shorthand.
   */
  visitPropertyShorthand(ctx) {
    if (ctx.Ellipsis()) this.appendString("...");
    this.visitChildren(ctx);
  }

  /**
   * Visits a setter.
   * @param {Object} ctx - Context of the setter.
   */
  visitSetter(ctx) {
    this.appendString("set ");
    this.visitPropertyName(ctx.propertyName());
  }

  /**
   * Visits a declaration.
   * @param {Object} ctx - Context of the declaration.
   */
  visitDeclaration(ctx) {
    if (ctx.variableStatement()) {
      this.visitVariableStatement(ctx.variableStatement());
    } else if (ctx.classDeclaration()) {
      this.visitClassDeclaration(ctx.classDeclaration());
    } else if (ctx.functionDeclaration()) {
      this.visitFunctionDeclaration(ctx.functionDeclaration());
    }
  }

  /**
   * Visits a variable statement.
   * @param {Object} ctx - Context of the variable statement.
   */
  visitVariableStatement(ctx) {
    this.visitVariableDeclarationList(ctx.variableDeclarationList());
    if (ctx.eos().getText().includes(";")) this.appendString(";");
    this.appendNewLine();
  }

  /**
   * Visits a var modifier.
   * @param {Object} ctx - Context of the var modifier.
   */
  visitVarModifier(ctx) {
    if (ctx.Var()) {
      this.appendString("var ");
    } else if (ctx.let_()) {
      this.appendString("let ");
    } else if (ctx.Const()) {
      this.appendString("const ");
    }
  }

  /**
   * Visits a variable declaration list.
   * @param {Object} ctx - Context of the variable declaration list.
   */
  visitVariableDeclarationList(ctx) {
    this.visitVarModifier(ctx.varModifier());
    const variableDeclarations = ctx.variableDeclaration();
    for (let i = 0; i < variableDeclarations.length; i++) {
      this.visitVariableDeclaration(variableDeclarations[i]);
      if (i < variableDeclarations.length - 1) {
        this.appendString(",");
      }
    }
  }

  /**
   * Visits a variable declaration.
   * @param {Object} ctx - Context of the variable declaration.
   */
  visitVariableDeclaration(ctx) {
    this.visitAssignable(ctx.assignable());
    if (ctx.children.length > 1) {
      this.appendString(" = ");
      this.visit(ctx.children[2]);
    }
  }

  /**
   * Visits a continue statement.
   * @param {Object} ctx - Context of the continue statement.
   */
  visitContinueStatement(ctx) {
    this.appendString("continue");
    if (ctx.identifier()) {
      this.appendString(" " + ctx.identifier().getText());
    }
    this.appendTokens(ctx.eos());
  }

  /**
   * Visits a break statement.
   * @param {Object} ctx - Context of the break statement.
   */
  visitBreakStatement(ctx) {
    this.appendString("break");
    if (ctx.identifier()) {
      this.appendString(" " + ctx.identifier().getText());
    }
    this.appendTokens(ctx.eos());
  }

  /**
   * Visits a return statement.
   * @param {Object} ctx - Context of the return statement.
   */
  visitReturnStatement(ctx) {
    this.appendString("return ");
    if (ctx.expressionSequence()) {
      this.visitExpressionSequence(ctx.expressionSequence());
      this.appendString(";");
      this.appendNewLine();
    } else {
      this.appendString(";");
      this.appendNewLine();
    }
  }

  /**
   * Visits a yield statement.
   * @param {Object} ctx - Context of the yield statement.
   */
  visitYieldStatement(ctx) {
    this.appendString("yield");
    if (ctx.expressionSequence()) {
      this.appendString(" " + ctx.expressionSequence().getText());
    }
    this.appendTokens(ctx.eos());
  }

  /**
   * Visits a with statement.
   * @param {Object} ctx - Context of the with statement.
   */
  visitWithStatement(ctx) {
    this.appendString("with (");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(")");
    this.visitStatement(ctx.statement());
  }

  /**
   * Visits a switch statement.
   * @param {Object} ctx - Context of the switch statement.
   */
  visitSwitchStatement(ctx) {
    this.appendString("switch ");
    this.appendString("(");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(")");
    this.visitCaseBlock(ctx.caseBlock());
  }

  /**
   * Visits a case block.
   * @param {Object} ctx - Context of the case block.
   */
  visitCaseBlock(ctx) {
    this.appendString("{");
    if (ctx.caseClauses(0)) {
      this.visitCaseClauses(ctx.caseClauses(0));
    }
    if (ctx.defaultClause()) {
      this.visitDefaultClause(ctx.defaultClause());
      if (ctx.caseClauses(1)) {
        this.visitCaseClauses(ctx.caseClauses(1));
      }
    }
    this.appendString("}");
  }

  /**
   * Visits case clauses.
   * @param {Object} ctx - Context of the case clauses.
   */
  visitCaseClauses(ctx) {
    for (const caseClause of ctx.caseClause()) {
      this.visitCaseClause(caseClause);
    }
  }

  /**
   * Visits a case clause.
   * @param {Object} ctx - Context of the case clause.
   */
  visitCaseClause(ctx) {
    this.appendString("case ");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(":");
    if (ctx.statementList()) {
      this.visitStatementList(ctx.statementList());
      this.appendNewLine();
    }
  }

  /**
   * Visits a default clause.
   * @param {Object} ctx - Context of the default clause.
   */
  visitDefaultClause(ctx) {
    this.appendString("default:");
    if (ctx.statementList()) {
      this.visitStatementList(ctx.statementList());
      this.appendNewLine();
    }
  }

  /**
   * Visits a labelled statement.
   * @param {Object} ctx - Context of the labelled statement.
   */
  visitLabelledStatement(ctx) {
    this.appendString(ctx.identifier().getText());
    this.appendString(" : ");
    this.visitStatement(ctx.statement());
  }

  /**
   * Visits a throw statement.
   * @param {Object} ctx - Context of the throw statement.
   */
  visitThrowStatement(ctx) {
    this.appendString("throw ");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(";");
  }

  /**
   * Visits a try statement.
   * @param {Object} ctx - Context of the try statement.
   */
  visitTryStatement(ctx) {
    this.appendString("try ");
    this.visitBlock(ctx.block());
    if (ctx.catchProduction()) {
      this.visitCatchProduction(ctx.catchProduction());
      if (ctx.finallyProduction())
        this.visitFinallyProduction(ctx.finallyProduction());
    } else {
      this.visitFinallyProduction(ctx.finallyProduction());
    }
  }

  /**
   * Visits a catch production.
   * @param {Object} ctx - Context of the catch production.
   */
  visitCatchProduction(ctx) {
    this.appendString("catch ");
    if (ctx.assignable()) {
      this.appendString("( ");
      this.visitAssignable(ctx.assignable());
      this.appendString(") ");
    }
    this.visitBlock(ctx.block());
  }

  /**
   * Visits a finally production.
   * @param {Object} ctx - Context of the finally production.
   */
  visitFinallyProduction(ctx) {
    this.appendString("finally ");
    this.visitBlock(ctx.block());
  }

  /**
   * Visits a debugger statement.
   * @param {Object} ctx - Context of the debugger statement.
   */
  visitDebuggerStatement(ctx) {
    this.appendString("debugger ");
    this.appendString(";");
  }

  /**
   * Visits a statement list.
   * @param {Object} ctx - Context of the statement list.
   */
  visitStatementList(ctx) {
    for (const statement of ctx.statement()) {
      this.visitStatement(statement);
      this.appendNewLine();
    }
  }

  /**
   * Visits an empty statement.
   * @param {Object} ctx - Context of the empty statement.
   */
  visitEmptyStatement_(ctx) {
    this.appendTokens(ctx.SemiColon());
  }

  /**
   * Visits an expression sequence.
   * @param {Object} ctx - Context of the expression sequence.
   */
  visitExpressionSequence(ctx) {
    for (let i = 0; i < ctx.children.length; i++) {
      this.visit(ctx.children[i]);
      if (i % 2 !== 0 && i !== 0) {
        this.appendString(",");
      }
    }
  }

  /**
   * Visits an if statement.
   * @param {Object} ctx - Context of the if statement.
   */
  visitIfStatement(ctx) {
    this.appendString("if ");
    this.appendString("(");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(") ");
    this.appendNewLine();
    this.visitStatement(ctx.statement(0));
    if (ctx.Else()) {
      this.appendString("else ");
      this.visitStatement(ctx.statement(1));
    }
  }

  /**
   * Visits a do statement.
   * @param {Object} ctx - Context of the do statement.
   */
  visitDoStatement(ctx) {
    this.appendString("do ");
    this.visitStatement(ctx.statement());
    this.appendString("while");
    this.appendString("(");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(")");
    this.appendTokens(ctx.eos());
  }

  /**
   * Visits a while statement.
   * @param {Object} ctx - Context of the while statement.
   */
  visitWhileStatement(ctx) {
    this.appendString("while ");
    this.appendString("(");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(")");
    this.visitStatement(ctx.statement());
  }

  /**
   * Visits a for statement.
   * @param {Object} ctx - Context of the for statement.
   */
  visitForStatement(ctx) {
    for (const childCtx of ctx.children) {
      if (childCtx.getText() === "for") this.appendString("for ");
      else if (childCtx.getText() === ";") this.appendString(";");
      else if (childCtx.getText() === "(") this.appendString("(");
      else if (childCtx.getText() === ")") this.appendString(")");
      else this.visit(childCtx);
    }
  }

  /**
   * Visits a for-of statement.
   * @param {Object} ctx - Context of the for-of statement.
   */
  visitForOfStatement(ctx) {
    this.appendString("for ");
    if (ctx.Await()) this.appendString("await ");
    this.appendString("(");

    if (ctx.variableDeclarationList())
      this.visitVariableDeclarationList(ctx.variableDeclarationList());
    else {
      if (ctx.Await()) this.visit(ctx.children[3]);
      else this.visit(ctx.children[2]);
    }

    if (ctx.identifier()) this.visitIdentifier(ctx.identifier());

    this.visitExpressionSequence(ctx.expressionSequence());

    this.appendString(")");
    this.visitStatement(ctx.statement());
  }

  /**
   * Visits an identifier.
   * @param {Object} ctx - Context of the identifier.
   */
  visitIdentifier(ctx) {
    this.appendString(ctx.getText() + " ");
  }

  /**
   * Visits an expression statement.
   * @param {Object} ctx - Context of the expression statement.
   */
  visitExpressionStatement(ctx) {
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(";");
  }

  /**
   * Visits an anonymous function.
   * @param {Object} ctx - Context of the anonymous function.
   */
  visitAnonymousFunction(ctx) {
    if (ctx.Async()) {
      this.appendTokens(ctx.Async());
    }
    this.appendTokens(ctx.Function_());
    if (ctx.Star()) {
      this.appendTokens(ctx.Star());
    }
    this.appendTokens(ctx.LeftParen());
    if (ctx.formalParameterList()) {
      this.visitFormalParameterList(ctx.formalParameterList());
    }
    this.appendTokens(ctx.RightParen());
    this.visitFunctionBody(ctx.functionBody());
  }

  /**
   * Visits a member index expression.
   * @param {Object} ctx - Context of the member index expression.
   */
  visitMemberIndexExpression(ctx) {
    this.visit(ctx.children[0]);
    if (ctx.children.length === 5) this.appendString(" ?. ");
    this.appendString("[ ");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(" ] ");
  }

  /**
   * Visits a member dot expression.
   * @param {Object} ctx - Context of the member dot expression.
   */
  visitMemberDotExpression(ctx) {
    this.visit(ctx.children[0]);
    if (ctx.children[1].getText().includes("?")) this.appendString(" ? ");
    this.appendString(".");
    if (ctx.children[ctx.children.length - 2].getText().includes("#"))
      this.appendString(" #");
    this.appendString(ctx.identifierName().getText());
  }

  /**
   * Visits a new expression.
   * @param {Object} ctx - Context of the new expression.
   */
  visitNewExpression(ctx) {
    this.appendString("new ");
    this.visitChildren(ctx);
  }

  /**
   * Visits arguments.
   * @param {Object} ctx - Context of the arguments.
   */
  visitArguments(ctx) {
    this.appendString("(");
    for (let i = 0; i < ctx.argument().length; i++) {
      this.visitArgument(ctx.argument(i));
      if (i !== ctx.argument().length - 1) this.appendString(", ");
    }
    this.appendString(") ");
  }

  /**
   * Visits an argument.
   * @param {Object} ctx - Context of the argument.
   */
  visitArgument(ctx) {
    if (ctx.Ellipsis()) this.appendTokens(ctx.Ellipsis());
    if (ctx.identifier()) this.appendString(ctx.identifier().getText());
    else this.visitChildren(ctx);
  }

  /**
   * Visits an additive expression.
   * @param {Object} ctx - Context of the additive expression.
   */
  visitAdditiveExpression(ctx) {
    this.visit(ctx.children[0]);
    if (ctx.children[1].getText().includes("+")) this.appendString("+ ");
    else this.appendString("- ");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits a property name.
   * @param {Object} ctx - Context of the property name.
   */
  visitPropertyName(ctx) {
    if (ctx.identifierName()) this.visitIdentifierName(ctx.identifierName());
    else if (ctx.StringLiteral())
      this.appendString(ctx.StringLiteral().getText());
    else if (ctx.numericLiteral()) this.appendTokens(ctx.numericLiteral());
    else {
      this.appendString(" [ ");
      this.visitChildren(ctx);
      this.appendString(" ] ");
    }
  }

  /**
   * Visits an arguments expression.
   * @param {Object} ctx - Context of the arguments expression.
   */
  visitArgumentsExpression(ctx) {
    this.visit(ctx.children[0]);
    this.visitArguments(ctx.arguments());
  }

  /**
   * Visits a meta expression.
   * @param {Object} ctx - Context of the meta expression.
   */
  visitMetaExpression(ctx) {
    this.appendString(" new");
    this.appendString(".");
    this.appendString(ctx.identifier().getText());
  }

  /**
   * Visits a post-increment expression.
   * @param {Object} ctx - Context of the post-increment expression.
   */
  visitPostIncrementExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("++ ");
  }

  /**
   * Visits a post-decrease expression.
   * @param {Object} ctx - Context of the post-decrease expression.
   */
  visitPostDecreaseExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("-- ");
  }

  /**
   * Visits a delete expression.
   * @param {Object} ctx - Context of the delete expression.
   */
  visitDeleteExpression(ctx) {
    this.appendString(" delete ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a void expression.
   * @param {Object} ctx - Context of the void expression.
   */
  visitVoidExpression(ctx) {
    this.appendString(" void ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a typeof expression.
   * @param {Object} ctx - Context of the typeof expression.
   */
  visitTypeofExpression(ctx) {
    this.appendString(" typeof ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a pre-increment expression.
   * @param {Object} ctx - Context of the pre-increment expression.
   */
  visitPreIncrementExpression(ctx) {
    this.appendString(" ++ ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a pre-decrease expression.
   * @param {Object} ctx - Context of the pre-decrease expression.
   */
  visitPreDecreaseExpression(ctx) {
    this.appendString(" -- ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a unary plus expression.
   * @param {Object} ctx - Context of the unary plus expression.
   */
  visitUnaryPlusExpression(ctx) {
    this.appendString("+ ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a unary minus expression.
   * @param {Object} ctx - Context of the unary minus expression.
   */
  visitUnaryMinusExpression(ctx) {
    this.appendString("- ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a bitwise NOT expression.
   * @param {Object} ctx - Context of the bitwise NOT expression.
   */
  visitBitNotExpression(ctx) {
    this.appendString(" ~ ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a logical NOT expression.
   * @param {Object} ctx - Context of the logical NOT expression.
   */
  visitNotExpression(ctx) {
    this.appendString(" ! ");
    this.visitChildren(ctx);
  }

  /**
   * Visits an await expression.
   * @param {Object} ctx - Context of the await expression.
   */
  visitAwaitExpression(ctx) {
    this.appendString(" await ");
    this.visitChildren(ctx);
  }

  /**
   * Visits a power expression.
   * @param {Object} ctx - Context of the power expression.
   */
  visitPowerExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString(" ** ");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits a multiplicative expression.
   * @param {Object} ctx - Context of the multiplicative expression.
   */
  visitMultiplicativeExpression(ctx) {
    this.visit(ctx.children[0]);

    const operator = ctx.children[1].getText();

    if (operator === "*") {
      this.appendString("*");
    } else if (operator === "/") {
      this.appendString("/");
    } else if (operator === "%") {
      this.appendString("%");
    }

    this.visit(ctx.children[2]);
  }

  /**
   * Visits a coalesce expression.
   * @param {Object} ctx - Context of the coalesce expression.
   */
  visitCoalesceExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("??");
    this.visit(ctx.children[1]);
  }

  /**
   * Visits a bitwise shift expression.
   * @param {Object} ctx - Context of the bitwise shift expression.
   */
  visitBitShiftExpression(ctx) {
    this.visit(ctx.children[0]);
    const operator = ctx.getChild(1).getText();

    if (operator === "<<") {
      this.appendString("<<");
    } else if (operator === ">>") {
      this.appendString(">>");
    } else if (operator === ">>>") {
      this.appendString(">>>");
    }

    this.visit(ctx.children[2]);
  }

  /**
   * Visits a relational expression.
   * @param {Object} ctx - Context of the relational expression.
   */
  visitRelationalExpression(ctx) {
    this.visit(ctx.children[0]);

    const operator = ctx.getChild(1).getText();

    if (operator === "<") {
      this.appendString("<");
    } else if (operator === ">") {
      this.appendString(">");
    } else if (operator === "<=") {
      this.appendString("<=");
    } else if (operator === ">=") {
      this.appendString(">=");
    }

    this.visit(ctx.children[2]);
  }

  /**
   * Visits an instanceof expression.
   * @param {Object} ctx - Context of the instanceof expression.
   */
  visitInstanceofExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("instanceof");
    this.visit(ctx.children[1]);
  }

  /**
   * Visits an in expression.
   * @param {Object} ctx - Context of the in expression.
   */
  visitInExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("in ");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits an equality expression.
   * @param {Object} ctx - Context of the equality expression.
   */
  visitEqualityExpression(ctx) {
    this.visit(ctx.children[0]);

    const operator = ctx.getChild(1).getText();

    if (operator === "==") {
      this.appendString("==");
    } else if (operator === "!=") {
      this.appendString("!=");
    } else if (operator === "===") {
      this.appendString("===");
    } else if (operator === "!==") {
      this.appendString("!==");
    }
    if (
      !ctx.children[2].getText().includes(";") &&
      ctx.children[2].getText().includes("[") &&
      !ctx.children[2].getText().includes("*") &&
      !ctx.children[2].getText().includes("/") &&
      ctx.children[2].getText().includes(".")
    ) {
      let modifiedText = ctx.children[2].getText();
      let index = modifiedText.indexOf("[");

      if (index !== -1) {
        modifiedText =
          modifiedText.slice(0, index) + ";" + modifiedText.slice(index);
      }

      this.appendString(modifiedText);
    } else {
      this.visit(ctx.children[2]);
    }
  }

  /**
   * Visits a logical AND expression.
   * @param {Object} ctx - Context of the logical AND expression.
   */
  visitLogicalAndExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("&&");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits a logical OR expression.
   * @param {Object} ctx - Context of the logical OR expression.
   */
  visitLogicalOrExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString("||");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits a ternary expression.
   * @param {Object} ctx - Context of the ternary expression.
   */
  visitTernaryExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString(" ? ");
    this.visit(ctx.children[2]);
    this.appendString(" : ");
    this.visit(ctx.children[4]);
  }

  /**
   * Visits an assignment expression.
   * @param {Object} ctx - Context of the assignment expression.
   */
  visitAssignmentExpression(ctx) {
    this.visit(ctx.children[0]);
    this.appendString(" = ");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits an assignment operator expression.
   * @param {Object} ctx - Context of the assignment operator expression.
   */
  visitAssignmentOperatorExpression(ctx) {
    this.visit(ctx.children[0]);
    this.visitAssigmentOperator(ctx.assignmentOperator());
    this.visit(ctx.children[2]);
  }

  /**
   * Visits an import expression.
   * @param {Object} ctx - Context of the import expression.
   */
  visitImportExpression(ctx) {
    this.appendString("import");
    this.appendString("(");
    this.visit(ctx.children[2]);
    this.appendString(")");
  }

  /**
   * Visits a yield expression.
   * @param {Object} ctx - Context of the yield expression.
   */
  visitYieldExpression(ctx) {
    this.visitChildren(ctx);
  }

  /**
   * Visits a this expression.
   */
  visitThisExpression(ctx) {
    this.appendString("this");
  }

  /**
   * Visits an identifier expression.
   * @param {Object} ctx - Context of the identifier expression.
   */
  visitIdentifierExpression(ctx) {
    this.appendString(ctx.getText() + " ");
  }

  /**
   * Visits a super expression.
   */
  visitSuperExpression() {
    this.appendString("super");
  }

  /**
   * Visits a literal expression.
   * @param {Object} ctx - Context of the literal expression.
   */
  visitLiteralExpression(ctx) {
    this.visitChildren(ctx);
  }

  /**
   * Visits an optional chain expression.
   * @param {Object} ctx - Context of the optional chain expression.
   */
  visitOptionalChainExpression(ctx) {
    this.visit(ctx.children[0]);
    if (ctx.children.length === 3) this.appendString(".");
    this.visit(ctx.children[2]);
  }

  /**
   * Visits a parenthesized expression.
   * @param {Object} ctx - Context of the parenthesized expression.
   */
  visitParenthesizedExpression(ctx) {
    this.appendString("(");
    this.visitExpressionSequence(ctx.children[1]);
    this.appendString(")");
  }

  /**
   * Visits an assignment operator.
   * @param {Object} ctx - Context of the assignment operator.
   */
  visitAssigmentOperator(ctx) {
    this.appendString(ctx.getText());
  }

  /**
   * Visits a literal.
   * @param {Object} ctx - Context of the literal.
   */
  visitLiteral(ctx) {
    if (ctx.templateStringLiteral())
      this.visitTemplateStringLiteral(ctx.templateStringLiteral());
    else this.appendString(ctx.getText());
  }

  /**
   * Visits a template string literal.
   * @param {Object} ctx - Context of the template string literal.
   */
  visitTemplateStringLiteral(ctx) {
    this.appendString("`");
    const templateStringAtoms = ctx.templateStringAtom();
    for (let i = 0; i < templateStringAtoms.length; i++) {
      this.visitTemplateStringAtom(templateStringAtoms[i]);
    }
    this.appendString("`");
  }

  /**
   * Visits a template string atom.
   * @param {Object} ctx - Context of the template string atom.
   */
  visitTemplateStringAtom(ctx) {
    if (ctx.TemplateStringAtom()) {
      this.appendString(ctx.TemplateStringAtom().getText());
    } else {
      this.appendString("${");
      this.appendString(ctx.children[1].getText());
      this.appendString("}");
    }
  }

  /**
   * Visits an HTML element.
   * @param {Object} ctx - Context of the HTML element.
   */
  visitHtmlElement(ctx) {
    this.appendString("<");
    if (ctx.htmlTagStartName()) {
      this.visitHtmlTagStartName(ctx.htmlTagStartName());
      for (const htmlAttribute of ctx.htmlAttribute()) {
        this.visitHtmlAttribute(htmlAttribute);
      }
      this.appendString(">");
      this.visitHtmlContent(ctx.htmlContent());
      this.appendString("<");
      this.visitHtmlTagClosingName(ctx.htmlTagClosingName());
    } else {
      this.visitChildren(ctx);
      if (ctx.getText().slice(-2) === "/>") this.appendString("/");
    }

    this.appendString(">");
  }

  /**
   * Visits an HTML tag name.
   * @param {Object} ctx - Context of the HTML tag name.
   */
  visitHtmlTagName(ctx) {
    this.appendString(ctx.getText());
  }

  /**
   * Visits an HTML attribute.
   * @param {Object} ctx - Context of the HTML attribute.
   */
  visitHtmlAttribute(ctx) {
    this.visitHtmlAttributeName(ctx.htmlAttributeName());
    if (ctx.htmlAttributeValue()) {
      this.appendString("=");
      this.visitHtmlAtributeValue(ctx.htmlAttributeValue());
    }
  }

  /**
   * Visits an HTML attribute name.
   * @param {Object} ctx - Context of the HTML attribute name.
   */
  visitHtmlAttributeName(ctx) {
    this.appendString(ctx.getText());
  }

  /**
   * Visits HTML character data.
   * @param {Object} ctx - Context of the HTML character data.
   */
  visitHtmlChardata(ctx) {
    this.appendString(ctx.getText());
  }

  /**
   * Visits HTML attribute value.
   * @param {Object} ctx - Context of the HTML attribute value.
   */
  visitHtmlAttributeValue(ctx) {
    if (ctx.objectExpressionSequence()) {
      visitObjectExpressionSequence(ctx.objectExpressionSequence());
    } else this.appendString(ctx.getText());
  }
}
