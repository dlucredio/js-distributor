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
    if(ctx.importFrom()) {

    } else {
        this.appendTokens(ctx.StringLiteral());
        this.appendString(";");
        this.appendNewLine();
    }
  }
}
