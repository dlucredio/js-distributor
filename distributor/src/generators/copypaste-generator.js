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

  // anonymousFunction # FunctionExpression
  
  /*
  functionDeclaration
    : Async? Function_ '*'? identifier '(' formalParameterList? ')' functionBody
    ;
  */
  visitFunctionDeclaration(ctx) {
    if (ctx.Async()) this.appendString(" async ")
    this.appendString(" function ");
    if (ctx.getText().includes("*")) this.appendString("*");
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
    if (ctx.getText().includes("*")) this.appendString("*");
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
    if (ctx.children[0].getText().includes("*")) this.appendString("*");
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

}