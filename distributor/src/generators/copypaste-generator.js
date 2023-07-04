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
}
