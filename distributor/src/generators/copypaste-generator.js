import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";
import { StringBuilder } from "./generator-utils.js";

export default class CopyPasteGenerator extends JavaScriptParserVisitor {
  constructor() {
    super();
    this.stringBuilder = new StringBuilder();
  }

  appendTokens(token) {
    if (token) {
      this.stringBuilder.append(token.getText());
    }
  }

  appendString(str) {
    if (str) {
      this.stringBuilder.append(str);
    }
  }

  appendNewLine() {
    this.stringBuilder.append("\n");
  }

  visitProgram(ctx) {
    this.appendTokens(ctx.HashBangLine());
    if (ctx.sourceElements()) {
      this.visitSourceElements(ctx.sourceElements());
    }
  }

  visitBlock(ctx) {
    this.appendString("{");
    if(ctx.statementList()) {
        this.visitStatementList(ctx.statementList());
    }
    this.appendString("}");
  }

  visitImportStatement(ctx) {
    this.appendString("import ");
    this.visitImportFromBlock(ctx.importFromBlock());
  }
  

  visitImportFromBlock(ctx) {
    if (ctx.importFrom()) {
        if (ctx.importDefault()){
          this.visitImportDefault(ctx.importDefault());
        }
        if (ctx.importNamespace()){
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

    visitImportModuleItems(ctx) {
      this.appendString("{");
      for (let i = 0; i < ctx.importAliasName().length; i++){
        this.visitImportAliasName(ctx.importAliasName(i));

        if (i == ctx.importAliasName().length - 1)
          break
        this.appendString(",");
      }
      
      this.appendString("}");
    }

    visitImportAliasName(ctx) {
      this.visitModuleExportName(ctx.moduleExportName());
      if (ctx.importedBinding()){
        this.appendString(" as ");
        this.visitImportedBinding(ctx.importedBinding());
      }
    }

    visitModuleExportName(ctx) {
      ctx.identifierName() ? this.appendString(ctx.identifierName().getText()) : this.appendString(ctx.StringLiteral().getText());
    }

    visitImportedBinding(ctx) {
      if (ctx.Identifier()) this.appendString(ctx.Identifier().getText());
      else if (ctx.Yield()) this.appendString(ctx.Yield().getText());
      else if (ctx.Await()) this.appendString(ctx.Await().getText());
    }

    visitIdentifierName(ctx){
      this.appendString(ctx.getText());
    }

    visitImportDefault(ctx){
      this.visitAliasName(ctx.aliasName());
      this.appendString(", ");
    } 

    visitAliasName(ctx){
      this.visitIdentifierName(ctx.identifierName(0));
      if (ctx.identifierName(1)){
        this.appendString(" as ");
        this.visitIdentifierName(ctx.identifierName(1));
      }
    }

    visitImportNamespace(ctx){
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

    visitImportFrom(ctx){
      this.appendString(" from ");
      this.appendString(ctx.StringLiteral().getText());
    }

    // regras de export.js
/*
exportStatement
    : Export Default? (exportFromBlock | declaration) eos    # ExportDeclaration
    | Export Default singleExpression eos                    # ExportDefaultDeclaration
    ;
*/
visitExportDeclaration(ctx) {
  this.appendString("export ");
  if (ctx.Default()) this.appendString(" default ");
  if (ctx.exportFromBlock()) this.visitExportFromBlock(ctx.exportFromBlock());
  else if (ctx.declaration()) this.visitDeclaration(ctx.declaration());
  this.appendString(";"); // -------------------------------- avaliar ;
  //this.appendNewLine();
}

visitExportDefaultDeclaration(ctx) {
  this.appendString("export ");
  this.appendString(" default ");
  this.visitChildren(ctx);
  this.appendString(";"); // -------------------------------- avaliar ;
  //this.appendNewLine();
}

/*
exportFromBlock
: importNamespace importFrom eos
| exportModuleItems importFrom? eos
;
*/
visitExportFromBlock(ctx) {
  if (ctx.importNamespace()){
    this.visitImportNamespace(ctx.importNamespace());
    this.visitImportFrom(ctx.importFrom());
  } else {
    this.visitExportModuleItems(ctx.exportModuleItems());
    if (ctx.importFrom()) this.visitImportFrom(ctx.importFrom());
  }
}

/*
exportModuleItems
: '{' (exportAliasName ',')* (exportAliasName ','?)? '}'
;
*/
visitExportModuleItems(ctx) {
  this.appendString("{ ");
  for (let i = 0; i < ctx.exportAliasName().length; i++){
    this.visitExportAliasName(ctx.exportAliasName(i));

    if (i !== ctx.exportAliasName().length - 1) this.appendString(", ");
  }
  this.appendString("}");
}

/*
exportAliasName
: moduleExportName (As moduleExportName)?
;
*/
visitExportAliasName(ctx) {
  this.visitModuleExportName(ctx.moduleExportName(0));
  if (ctx.moduleExportName(1)){
    this.appendString(" as ");
    this.visitModuleExportName(ctx.moduleExportName(1));
}
}


/*
functionDeclaration
: Async? Function_ '*'? identifier '(' formalParameterList? ')' functionBody
;
*/
visitFunctionDeclaration(ctx) {
  if (ctx.Async()) this.appendString(" async ")
  this.appendString(" function ");
  if (ctx.getText().includes("")) this.appendString("");
  this.appendString(ctx.identifier().getText());
  this.appendString("(");
  if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
  this.appendString(")");
  this.visitFunctionBody(ctx.functionBody());
}


/*
anonymousFunction
: Async? Function_ '*'? '(' formalParameterList? ')' functionBody    # AnonymousFunctionDecl
| Async? arrowFunctionParameters '=>' arrowFunctionBody                     # ArrowFunction
;
*/
// ta cheganndo contexto errado
visitAnonymousFunctionDecl(ctx) {
  if (ctx.Async()) this.appendTokens(ctx.Async());
  this.appendTokens(ctx.Function_());
  if (ctx.getText().includes("")) this.appendString("");
  this.appendString("(");
  if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
  this.appendString(")");
  this.visitFunctionBody(ctx.functionBody());

}

visitArrowFunction(ctx) {
if (ctx.Async()) this.appendTokens(ctx.Async());
this.visitArrowFunctionParameters(ctx.arrowFunctionParameters());
this.appendString(" => ");
this.visitArrowFunctionBody(ctx.arrowFunctionBody());
}

/*
arrowFunctionParameters
: identifier
| '(' formalParameterList? ')'
;
*/
visitArrowFunctionParameters(ctx) {
  if (ctx.identifier()) this.appendTokens(ctx.identifier());
  else {
    this.appendString("( ");
    if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
    this.appendString(" ) ");
  }
}


 /*
  formalParameterList
    : formalParameterArg (',' formalParameterArg)* (',' lastFormalParameterArg)?
    | lastFormalParameterArg
    ;
  */
    visitFormalParameterList(ctx) {
      if (ctx.formalParameterArg()) {
        for (let i = 0; i < ctx.formalParameterArg().length; i++) {
          this.visitFormalParameterArg(ctx.formalParameterArg(i));
          if (i !== ctx.formalParameterArg().length - 1) this.appendString(", ");
        }
  
        if (ctx.lastFormalParameterArg()) { 
          this.appendString("," );
          this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
        }
      } else {
        this.visitLastFormalParameterArg(ctx.lastFormalParameterArg());
      }
    }
  
    /*
    formalParameterArg
      : assignable ('=' singleExpression)?      // ECMAScript 6: Initialization
      ;
    */
    visitFormalParameterArg(ctx) {
      this.visitAssignable(ctx.assignable());
      if (ctx.children.length > 1) {
        this.appendString(" = ");
        this.visitChildren(ctx);
      }
    }
  
    /*
    assignable
      : identifier
      | arrayLiteral
      | objectLiteral
      ;
    */
    visitAssignable(ctx) {
      if (ctx.identifier()) this.appendString(ctx.identifier().getText());
      else this.visitChildren(ctx);
    }
  
    /*
    arrayLiteral
      : ('[' elementList ']')
      ;
    */
   visitArrayLiteral(ctx) {
      this.appendString("[ ");
      this.visitElementList(ctx.elementList());
      this.appendString("] ");
   }
   /*
   objectLiteral
      : '{' (propertyAssignment (',' propertyAssignment)* ','?)? '}'
      ;
    */
   visitObjectLiteral(ctx) {
      this.appendString("{ ");
      for (let i = 0; i < ctx.propertyAssignment().length - 1; i++) {
        this.visitChildren(ctx.children[i]);
        if (i != ctx.propertyAssignment().length - 1) this.appendString(", ");
      }
      this.appendString("}");
   }
  
   /*
   elementList
      : ','* arrayElement? (','+ arrayElement)* ','* // Yes, everything is optional
      ;
   */
   visitElementList(ctx) {
      for (let i = 0; i < ctx.arrayElement().length - 1; i++) {
        this.visitArrayElement(ctx.arrayElement(i));
        if (i !== ctx.arrayElement().length - 1) this.appendString(", ");
      }
   }
  
   /*
   arrayElement
      : Ellipsis? singleExpression
      ;
    */
    visitArrayElement(ctx) {
      if (ctx.Ellipsis()) this.appendTokens(ctx.Ellipsis());
      this.visitChildren(ctx);
    }
    
    /*
    lastFormalParameterArg                        // ECMAScript 6: Rest Parameter
      : Ellipsis singleExpression
      ;
    */
    visitLastFormalParameterArg(ctx) {
      this.appendTokens(ctx.Ellipsis());
      this.visitChildren(ctx);
    }
  
    /*
    functionBody
      : '{' sourceElements? '}'
      ;
    */
    visitFunctionBody(ctx) {
      this.appendString("{ ");
      if (ctx.sourceElements()) this.visitSourceElement(ctx.sourceElements());
      this.appendString("} ");
    }
  
    /*
    classDeclaration
      : Class identifier classTail
      ;
    */
  
    visitClassDeclaration(ctx) {
      this.appendString("class ");
      this.appendString(ctx.identifier().getText());
      this.visitClassTail(ctx.classTail());
    }
    
    // | Class identifier? classTail                                           # ClassExpression
    visitClassExpression(ctx) {
      this.appendString("class ");
      if (ctx.identifier()) this.visitIdentifier(ctx.identifier());
      this.visitClassTail(ctx.classTail());
    }
  
    /*
    classTail
      : (Extends singleExpression)? '{' classElement* '}'
      ;
    */
    visitClassTail(ctx) {
      if (ctx.Extends()) {
        this.appendString(" extends ");
        this.visitChildren(ctx.children[1]);
      }
      this.appendString("{");
      for (let i = 0; i < ctx.classElement().length; i++) {
        this.visitClassElement(ctx.classElement(i));
      }
      this.appendString("}");
    }
  
    /*
    classElement
      : (Static | {this.n("static")}? identifier | Async)* (methodDefinition | assignable '=' objectLiteral ';')
      | emptyStatement_
      | '#'? propertyName '=' singleExpression
      ;
    */
    visitClassElement(ctx) {
      if (ctx.emptyStatement_()) {
        this.appendString(";");
      } else if (ctx.propertyName()) {
        if (ctx.children.length === 4) this.appendString("# ");
        this.visitPropertyName(ctx.propertyName());
        this.appendString(" = ");
        this.visitChildren(ctx.children[ctx.children.length - 1]);
      } else {
        for (const tk of ctx.Static()) {
          this.appendString(tk.getText()+ " ");
        }
        for (const tk of ctx.identifier()) {
          this.appendString(tk.getText() + " ");
        }
        for (const tk of ctx.Async()) {
          this.appendString(tk.getText()+ " ");
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
    /*
    methodDefinition
      : '*'? '#'? propertyName '(' formalParameterList? ')' functionBody
      | '*'? '#'? getter '(' ')' functionBody
      | '*'? '#'? setter '(' formalParameterList? ')' functionBody
      ;
    */
    visitMethodDefinition(ctx) {
      if (ctx.children[0].getText().includes("")) this.appendString("");
      if (ctx.children[0].getText().includes("#") || ctx.children[1].getText().includes("#")) this.appendString("#");
      if (ctx.propertyName()) {
        this.visitPropertyName(ctx.propertyName());
        this.appendString("(");
        if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
        this.appendString(")");
      }
      else if (ctx.getter()) {
        this.visitGetter(ctx.getter());
        this.appendString("(");
        this.appendString(")");
      } else {
        this.visitSetter(ctx.setter());
        this.appendString("(");
        if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
        this.appendString(")");
      }
      this.visitFunctionBody(ctx.functionBody());
    }

    // declaration
    visitDeclaration(ctx) {
      if (ctx.variableStatement()) {
        this.visitVariableStatement(ctx.variableStatement());
      } else if (ctx.classDeclaration()) {
        this.visitClassDeclaration(ctx.classDeclaration());
      } else if (ctx.functionDeclaration()) {
        this.visitFunctionDeclaration(ctx.functionDeclaration());
      }
    }

    visitVariableStatement(ctx) {
      this.visitVariableDeclarationList(ctx.variableDeclarationList());
      //this.appendTokens(ctx.eos());
    }

    // varModifier
    visitVarModifier(ctx) {
      if (ctx.Var()) {
        this.appendString("var ");
      } else if (ctx.let_()) {
        this.appendString("let ");
      } else if (ctx.Const()) {
        this.appendString("const ");
      }
    }
    
    // variableDeclaration
    visitVariableDeclarationList(ctx) {
      this.visitVarModifier(ctx.varModifier());
      const variableDeclarations = ctx.variableDeclaration();
      for (let i = 0; i < variableDeclarations.length; i++) {
        this.visitVariableDeclaration(variableDeclarations[i]);
        if (i < variableDeclarations.length - 1) {
          this.appendString(",");
        }
      }
      this.appendString(';');
    }

    // variableDeclaration
    visitVariableDeclaration(ctx) {
      //if(ctx.assignable()) this.visitAssignable(ctx.assignable());
      this.visitChildren(ctx.children[0])
      if (ctx.children[0]) {
        this.appendString(ctx.children[0].getText());
      }
      if (ctx.children[1]){
        this.appendString(ctx.children[1].getText())

      }
      if(ctx.children[2]){
        this.appendString(ctx.children[2].getText())
      }
      this.appendNewLine();
      //this.appendString(';');
    }

      // continueStatement
    visitContinueStatement(ctx) {
      this.appendString("continue");
      if (ctx.notLineTerminator() && ctx.identifier()) {
        this.appendString(" " + ctx.identifier().getText());
      }
      this.appendTokens(ctx.eos());
    }

    // breakStatement
    visitBreakStatement(ctx) {
      this.appendString("break");
      if (ctx.notLineTerminator() && ctx.identifier()) {
        this.appendString(" " + ctx.identifier().getText());
      }
      this.appendTokens(ctx.eos());
    }

    // returnStatement
    visitReturnStatement(ctx) {
      this.appendString("return");
      if (ctx.expressionSequence()) {
        this.appendString(" " + ctx.expressionSequence().getText());
      }
      this.appendTokens(ctx.eos());
    }

    //yieldStatement
    visitYieldStatement(ctx){
      this.appendString("yield");
      if(ctx.expressionSequence()){
        this.appendString(" " + ctx.expressionSequence().getText());
      }
      this.appendTokens(ctx.eos());
    }

    //withStatement
    visitWithStatement(ctx){
      this.appendString("with (");
      this.visitExpressionSequence(ctx.expressionSequence());
      this.appendString(")");
      this.visitStatement(ctx.statement());
    }

    //SwitchStatement
    visitSwitchStatement(ctx){
      this.appendString("switch ");
      this.appendString("(");
      this.visitExpressionSequence(ctx.expressionSequence());
      this.appendString(")");
      this.visitCaseBlock(ctx.caseBlock())
    }

    //caseBlock
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

    // caseClauses
    visitCaseClauses(ctx) {
      for (const caseClause of ctx.caseClause()) {
        this.visitCaseClause(caseClause);
      }
    }

    // caseClause
    visitCaseClause(ctx) {
     this.appendString("case ");
     this.visitExpressionSequence(ctx.expressionSequence());
     this.appendString(":");
     if(ctx.statementList()){
      this.visitStatementList(ctx.statementList());
      this.appendNewLine();
     }
    }

    // defaultClause
    visitDefaultClause(ctx) {
      this.appendString("default:");
      if (ctx.statementList()) {
        this.visitStatementList(ctx.statementList());
        this.appendNewLine()
      }
    }

        /*
    labelledStatement --
    : identifier ':' statement
    ;
    */
  visitLabelledStatement(ctx) {
    this.appendString(ctx.identifier().getText());
    this.appendString(" : ");
    this.visitStatement(ctx.statement())
  }

     /*
throwStatement --
    : Throw {this.notLineTerminator()}? expressionSequence eos
    ;
    */
    visitThrowStatement(ctx) {
      this.appendString("throw ");
      //? duvida
      this.visitExpressionSequence(ctx.expressionSequence());
      this.appendString(";");
    }
    
    /*
tryStatement --
    : Try block (catchProduction finallyProduction? | finallyProduction)
    ;
    */
    visitTryStatement(ctx) {
      this.appendString("try ");
      this.visitBlock(ctx.block());
      if (ctx.catchProduction()) {
        this.visitCatchProduction(ctx.catchProduction());
        if (ctx.finallyProduction()) this.visitFinallyProduction(ctx.finallyProduction());
      } else {
        this.visitFinallyProduction(ctx.finallyProduction());
      }
    }

    /*
    catchProduction --
    : Catch ('(' assignable? ')')? block
    ;
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

    /*
    
finallyProduction -- 
    : Finally block
    ;
    */
    visitFinallyProduction(ctx) {
      this.appendString("finally ");
      this.visitBlock(ctx.block());
    }
    /*
debuggerStatement --
    : Debugger eos
    ;
    */
    visitDebuggerStatement(ctx) {
      this.appendString("debugger ");
      this.appendString(";");
    }

    // statementList
    visitStatementList(ctx) {
      for (const statement of ctx.statement()) {
        this.visitStatement(statement);
        this.appendNewLine()
      }
    }

    // emptyStatement_
    visitEmptyStatement_(ctx){
      this.appendTokens(ctx.SemiColon())
    }

   /* visitExpressionStatement(ctx) {
      if (!this.notOpenBraceAndNotFunction()) {
        this.visitExpressionSequence(ctx.expressionSequence());
        this.appendTokens(ctx.eos());
      }
    }*/

    // expressionSequence
    visitExpressionSequence(ctx) {
      for (let i = 0; i < ctx.children.length; i++) {
        this.visitChildren(ctx.children[i]);
        this.appendString(ctx.children[i].getText())
        if (i < ctx.children.length - 1) {
          //this.appendString(",");
        }
      }
    }
    
    // ifStatement
    visitIfStatement(ctx) {
      this.appendString("if");
      this.appendString("(");
      this.visitExpressionSequence(ctx.expressionSequence());
      this.appendString(") ");
      this.visitStatement(ctx.statement(0));
      if (ctx.Else()) {
        this.appendString("else ");
        this.visitStatement(ctx.statement(1));
      }
    }

    // iterationStatement
    visitIterationStatement(ctx) {
      if (ctx.Do()) {
        this.appendString("do");
        this.visitStatement(ctx.statement());
        this.appendString("while");
        this.appendString("(");
        this.visitExpressionSequence(ctx.expressionSequence());
        this.appendString(")");
        this.appendTokens(ctx.eos());
      } else if (ctx.While()) {
        this.appendString("while");
        this.appendString("(");
        this.visitExpressionSequence(ctx.expressionSequence());
        this.appendString(")");
        this.visitStatement(ctx.statement());
      } else if (ctx.For()) {
        this.appendString("for");
        this.appendString("(");
        if (ctx.expressionSequence()) {
          this.visitExpressionSequence(ctx.expressionSequence(0));
        } else if (ctx.variableDeclarationList()) {
          this.visitVariableDeclarationList(ctx.variableDeclarationList());
        }
        this.appendString(";");
        if (ctx.expressionSequence(1)) {
          this.visitExpressionSequence(ctx.expressionSequence(1));
        }
        this.appendString(";");
        if (ctx.expressionSequence(2)) {
          this.visitExpressionSequence(ctx.expressionSequence(2));
        }
        this.appendString(")");
        this.visitStatement(ctx.statement());
      } else if (ctx.ForAwait) {
        this.appendString("for");
        if (ctx.Await()) {
          this.appendString("await ");
        }
        this.appendString("(");
        if (ctx.singleExpression()) {
          this.visitSingleExpression(ctx.singleExpression());
        } else if (ctx.variableDeclarationList()) {
          this.visitVariableDeclarationList(ctx.variableDeclarationList());
        }
        this.visitIdentifier(ctx.identifier());
        if (this.p("of")) {
          this.appendString(" of ");
        }
        this.visitExpressionSequence(ctx.expressionSequence());
        this.appendString(")");
        this.visitStatement(ctx.statement());
      }
    }


    // statement
    visitStatement(ctx) {
      switch (ctx.children[0].constructor.name) {
        case "BlockContext":
          this.visitBlock(ctx.block());
          break;
        case "VariableStatementContext":
          this.visitVariableStatement(ctx.variableStatement());
          break;
        case "ImportStatementContext":
          this.visitImportStatement(ctx.importStatement());
          break;
        case "EmptyStatement_Context":
          this.appendString(";");
          break;
        case "ClassDeclarationContext":
          this.visitClassDeclaration(ctx.classDeclaration());
          break;
        case "FunctionDeclarationContext":
          this.visitFunctionDeclaration(ctx.functionDeclaration());
          break;
        case "ExpressionStatementContext":
          this.visitExpressionStatement(ctx.expressionStatement());
          break;
        case "IfStatementContext":
          this.visitIfStatement(ctx.ifStatement());
          break;
        case "IterationStatementContext":
          this.visitIterationStatement(ctx.iterationStatement());
          break;
        case "ContinueStatementContext":
          this.appendString("continue;");
          break;
        case "BreakStatementContext":
          this.appendString("break;");
          break;
        case "ReturnStatementContext":
          this.visitReturnStatement(ctx.returnStatement());
          break;
        case "YieldStatementContext":
          this.visitYieldStatement(ctx.yieldStatement());
          break;
        case "WithStatementContext":
          this.visitWithStatement(ctx.withStatement());
          break;
        case "LabelledStatementContext":
          this.visitLabelledStatement(ctx.labelledStatement());
          break;
        case "SwitchStatementContext":
          this.visitSwitchStatement(ctx.switchStatement());
          break;
        case "ThrowStatementContext":
          this.visitThrowStatement(ctx.throwStatement());
          break;
        case "TryStatementContext":
          this.visitTryStatement(ctx.tryStatement());
          break;
        case "DebuggerStatementContext":
          this.appendString("debugger;");
          break;
        default:
          this.appendString(ctx.getText());
          break;
      }
    }
    
    // anonymousFunction
  visitAnonymousFunction(ctx) {
    if (ctx.Async) {
      this.appendTokens(ctx.Async);
    }
    this.appendTokens(ctx.Function_);
    if (ctx.Star) {
      this.appendTokens(ctx.Star);
    }
    this.appendTokens(ctx.LeftParen);
    if (ctx.formalParameterList) {
      this.visitFormalParameterList(ctx.formalParameterList);
    }
    this.appendTokens(ctx.RightParen);
    this.visitFunctionBody(ctx.functionBody);
  }
    


  //singleExpression

    // | singleExpression '?.'? '[' expressionSequence ']'                     # MemberIndexExpression
  visitMemberIndexExpression(ctx) {
    if (ctx.children.length === 5) this.appendString(" ?. ");
    this.appendString("[ ");
    this.visitExpressionSequence(ctx.expressionSequence());
    this.appendString(" ] ");
  }

  //| singleExpression '?'? '.' '#'? identifierName                         # MemberDotExpression
  visitMemberDotExpression(ctx) { 
    this.visitChildren(ctx.children[0]);
    if (ctx.children[1].getText().includes("?")) this.appendString(" ? ");
    this.appendString(" . ");
    if (ctx.children[ctx.children.length-2].getText().includes("#")) this.appendString(" # ");
    this.appendString(ctx.identifierName().getText());
  }

  //| New singleExpression arguments                                        # NewExpression
  visitNewExpression(ctx) {
    this.appendString("new ");
    this.visitChildren(ctx);
  }

  /*
  arguments
    : '('(argument (',' argument)* ','?)?')'
    ;
  */
  visitArguments(ctx) {
    this.appendString("(");
    for (let i = 0; i < ctx.argument().length; i++) {
      this.visitArgument(ctx.argument(i));
      if (i !== ctx.argument().length - 1) this.appendString(", ");
    }
    this.appendString(") ");
  }

  /*
  argument
    : Ellipsis? (singleExpression | identifier)
    ;
  */
  visitArgument(ctx) {
    if (ctx.Ellipsis()) this.appendTokens(ctx.Ellipsis());
    if (ctx.identifier()) this.appendString(ctx.identifier().getText());
    else this.visitChildren(ctx);

  }

  //  singleExpression ('+' | '-') singleExpression   
  visitAdditiveExpression(ctx) {
    this.visitChildren(ctx.children[0]);
    if (ctx.children[1].getText().includes("+")) this.appendString("+ ");
    else this.appendString("- ");
    this.visitChildren(ctx.children[1]);
  }

  /*
  propertyName
    : identifierName
    | StringLiteral
    | numericLiteral
    | '[' singleExpression ']'
    ;
  */
  visitPropertyName(ctx) {
    if (ctx.identifierName()) this.appendString(ctx.identifierName().getText());
    else if (ctx.StringLiteral()) this.appendString(ctx.StringLiteral().getText());
    else if (ctx.numericLiteral()) this.appendTokens(ctx.numericLiteral());
    else {
      this.appendString(" [ ");
      this.visitChildren(ctx);
      this.appendString(" ] ");
    }
  }

  //| singleExpression arguments                                            # ArgumentsExpression
  visitArgumentsExpression(ctx) {
    this.visitChildren(ctx.children[0]);
    this.visitArguments(ctx.arguments());
  }

  //| New '.' identifier                                                    # MetaExpression // new.target - duvida
  visitMetaExpression(ctx) {
    this.appendString(" new ");
    this.appendString(" . ");
    this.appendString(ctx.identifier().getText());
  }

  //| singleExpression {this.notLineTerminator()}? '++'                     # PostIncrementExpression - duvida
  visitPostIncrementExpression(ctx) {
    this.visitChildren(ctx.children[0]);
    //?
    this.appendString(" ++ ");
  }

  // | singleExpression {this.notLineTerminator()}? '--'                     # PostDecreaseExpression
  visitPostDecreaseExpression(ctx) {
    this.visitChildren(ctx.children[0]);
    // ?
    this.appendString(" -- ");
  }

  //| Delete singleExpression                                               # DeleteExpression
  visitDeleteExpression(ctx) {
    this.appendString(" delete ");
    this.visitChildren(ctx);
  }  

  //   | Void singleExpression                                                 # VoidExpression
  visitVoidExpression(ctx) {
    this.appendString(" void ");
    this.visitChildren(ctx);
  }

  // | Typeof singleExpression                                               # TypeofExpression
  visitTypeofExpression(ctx) {
    this.appendString(" typeof ");
    this.visitChildren(ctx);
  }

  //| '++' singleExpression                                                 # PreIncrementExpression
  visitPreIncrementExpression(ctx) {
    this.appendString(" ++ ");
    this.visitChildren(ctx);
  }

  // | '--' singleExpression                                                 # PreDecreaseExpression
  visitPreDecreaseExpression(ctx) {
    this.appendString(" -- ");
    this.visitChildren(ctx);
  }

  //| '+' singleExpression                                                  # UnaryPlusExpression
  visitUnaryPlusExpression(ctx) {
    this.appendString("+ ");
    this.visitChildren(ctx);
  }

  //| '-' singleExpression                                                  # UnaryMinusExpression
  visitUnaryMinusExpression(ctx) {
    this.appendString("- ");
    this.visitChildren(ctx);
  }

  // | '~' singleExpression                                                  # BitNotExpression
  visitBitNotExpression(ctx) {
    this.appendString(" ~ ");
    this.visitChildren(ctx);
  }

  // | '!' singleExpression                                                  # NotExpression
  visitNotExpression(ctx) {
    this.appendString(" ! ");
    this.visitChildren(ctx);
  }

  // | Await singleExpression                                                # AwaitExpression
  visitAwaitExpression(ctx) {
    this.appendString(" await ");
    this.visitChildren(ctx);
  }

  /*
    | <assoc=right> singleExpression '**' singleExpression                  # PowerExpression duvida
  */

  visitPowerExpression(ctx) {
    //? duvida
    this.visitChildren(ctx.children[0]);
    this.appendString(" ** ");
    this.visitChildren(ctx.children[1]);
  }

    // MultiplicativeExpression
  visitMultiplicativeExpression(ctx) {
    this.visitChildren(ctx.children[0]) // Visita a primeira subexpressão ***

    const operator = ctx.getChild(1).getText(); // Obtém o texto do operador

    if (operator === '*') {
      this.appendString("*");
    } else if (operator === '/') {
      this.appendString("/");
    } else if (operator === '%') {
      this.appendString("%");
    }

    this.visitChildren(ctx.children[2]); // Visita a segunda subexpressão
  }

  // AdditiveExpression
  visitAdditiveExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    const operator = ctx.getChild(1).getText(); // Obtém o texto do operador

    if (operator === '+') {
      this.appendString("+");
    } else if (operator === '-') {
      this.appendString("-");
    }

    this.visitChildren(ctx.children[2]); // Visita a segunda subexpressão
  }

  // CoalesceExpression
  visitCoalesceExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    this.appendString("??");

    this.visitChildren(ctx.children[1]); // Visita a segunda subexpressão
  }

  // BitShiftExpression
  visitBitShiftExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    const operator = ctx.getChild(1).getText(); // Obtém o texto do operador de deslocamento

    if (operator === '<<') {
      this.appendString("<<");
    } else if (operator === '>>') {
      this.appendString(">>");
    } else if (operator === '>>>') {
      this.appendString(">>>");
    }

    this.visitChildren(ctx.children[2]); // Visita a segunda subexpressão
  }

  // RelationalExpression
  visitRelationalExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    const operator = ctx.getChild(1).getText(); // Obtém o texto do operador

    if (operator === '<') {
      this.appendString("<");
    } else if (operator === '>') {
      this.appendString(">");
    } else if (operator === '<=') {
      this.appendString("<=");
    } else if (operator === '>=') {
      this.appendString(">=");
    }

    this.visitChildren(ctx.children[2]); // Visita a segunda subexpressão
  }

  // InstanceofExpression
  visitInstanceofExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    this.appendString("instanceof");

    this.visitChildren(ctx.children[1]); // Visita a segunda subexpressão
  }

  // InExpression
  visitInExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    this.appendString("in");

    this.visitChildren(ctx.children[1]); // Visita a segunda subexpressão
  }

  // EqualityExpression
  visitEqualityExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão

    const operator = ctx.getChild(1).getText(); // Obtém o texto do operador

    if (operator === '==') {
      this.appendString("==");
    } else if (operator === '!=') {
      this.appendString("!=");
    } else if (operator === '===') {
      this.appendString("===");
    } else if (operator === '!==') {
      this.appendString("!==");
    }

    this.visitChildren(ctx.children[1]); // Visita a segunda subexpressão
  }
  // LogicalAndExpression
  visitLogicalAndExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão
    this.appendString("&&");
    this.visitChildren(ctx.children[1]); // Visita a segunda subexpressão
  }

  // LogicalOrExpression
  visitLogicalOrExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a primeira subexpressão
    this.appendString("||");
    this.visitChildren(ctx.children[1]); // Visita a segunda subexpressão
  }

  // TernaryExpression
  visitTernaryExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a expressão condicional
    this.appendString("?");
    this.visitChildren(ctx.children[1]); // Visita a expressão verdadeira
    this.appendString(":");
    this.visitChildren(ctx.children[2]); // Visita a expressão falsa
  }

  // AssignmentExpression
  visitAssignmentExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a expressão à esquerda
    this.appendString("=");
    this.visitChildren(ctx.children[1]); // Visita a expressão à direita
  }

  // AssignmentOperatorExpression
  visitAssignmentOperatorExpression(ctx) {
    this.visitChildren(ctx.children[0]); // Visita a expressão à esquerda

    const operator = ctx.assignmentOperator().getText(); // Obtém o texto do operador de atribuição

    this.appendString(operator);

    this.visitSingleExpression(ctx.singleExpression(1)); // Visita a expressão à direita
  }

  // ImportExpression
  visitImportExpression(ctx) {
    this.appendString("import");
    this.appendString("(");
    this.visitChildren(ctx.children[0]);
    this.appendString(")");
  }

  //YieldExpression
  visitYieldExpression(ctx) {
    this.visitChildren(ctx);
  }

  //ThisExpression
  visitThisExpression() {
    this.appendString("this");
  }

  //identifierExpression
  visitIdentifierExpression(ctx) {
    this.visitChildren(ctx);
  }

  //SuperExpression
  visitSuperExpression(){
    this.appendString("super");
  }

  //LiteralExpression
  visitLiteralExpression(ctx) {
    this.visitChildren(ctx);
  }

  //ArrayLiteralExpression
  visitArrayLiteralExpression(ctx) {
    this.appendString("[");
    const expressions = ctx.Children;
    for (let i = 0; i < expressions.length; i++) {
      this.visitChildren(expressions[i]);
      if (i < expressions.length - 1) {
        this.appendString(",");
      }
    }
    this.appendString("]");
  }

  visitObjectLiteralExpression(ctx) {
    this.appendString("{");
    const propertyAssignments = ctx.propertyAssignment();
    for (let i = 0; i < propertyAssignments.length; i++) {
      this.visitPropertyAssignment(propertyAssignments[i]);
      if (i < propertyAssignments.length - 1) {
        this.appendString(",");
      }
    }
    this.appendString("}");
  }

  //ParenthesizedExpression
  visitParenthesizedExpression(ctx){
    this.appendString('(');
    this.visitExpressionSequence(ctx);
    this.appendString(')');
  }

  // assignmentOperator
  visitAssigmentOperator(ctx){
    const op = ctx.getText();
    if(op === '*='){
      this.appendString('*= ');
    } else if(op === '/='){
      this.appendString('/= ');
    }else if(op === '%= '){
      this.appendString('%= ');
    }else if(op === '+= '){
      this.appendString('+= ');
    }else if(op === '-='){
      this.appendString('-=');
    }else if(op === '<<='){
      this.appendString('<<= ');
    }else if(op === '>>='){
      this.appendString('>>= ');
    }else if(op === '>>>='){
      this.appendString('>>>= ');
    }else if(op === '&='){
      this.appendString('&= ');
    }else if(op === '^='){
      this.appendString('^= ');
    }else if(op === '|='){
      this.appendString('|= ');
    }else if(op === '**='){
      this.appendString('**= ');
    }
  }
  /*

  literal
      : NullLiteral
      | BooleanLiteral
      | StringLiteral
      | templateStringLiteral
      | RegularExpressionLiteral
      | numericLiteral
      | bigintLiteral
      ;
  */
  visitLiteral(ctx) {
    this.visitChildren(ctx);
  }

  visitTemplateStringLiteral(ctx) {
    this.appendString('`');
    const templateStringAtoms = ctx.templateStringAtom();
    for (let i = 0; i < templateStringAtoms.length; i++) {
      this.visitTemplateStringAtom(templateStringAtoms[i]);
    }
    this.appendString('`');
  }

  visitTemplateStringAtom(ctx) {
    if (ctx.TemplateStringAtom()) {
      this.appendString(ctx.TemplateStringAtom().getText());
    } else {
      this.appendString('${');
      this.visitSingleExpression(ctx.singleExpression());
      this.appendString('}');
    }
  }


}