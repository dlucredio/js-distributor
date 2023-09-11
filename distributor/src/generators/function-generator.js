import CopyPasteGenerator from "./copypaste-generator.js";
import { StringBuilder } from "./generator-utils.js";

// variavel global para permitir ou nao declaracao da funcao
let isFunctionDeclaration = false;

export default class FunctionGenerator extends CopyPasteGenerator {
  constructor() {
    super();
  }

  // sobreposicao de visitFunctionDeclaration 
  visitFunctionDeclaration(ctx) {
    if(isFunctionDeclaration) {
        if (ctx.Async()) this.appendString("async ")
        this.appendString("function ");
        if (ctx.children[1].getText().includes("*") || ctx.children[2].getText().includes("*")) this.appendString("*");
        this.appendString(ctx.identifier().getText());
        this.appendString("(");
        if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
        this.appendString(")");
        this.visitFunctionBody(ctx.functionBody());
        }
    }

  generateFunctions(ctx) {
    // todos codigos gerados
    const generatedCode = [];

    // visitar programa para gerar codigo do arquivo de entrada sem declaracao da funcao
    this.visitProgram(ctx);

    // colocar codigo gerado em array
    generatedCode.push(this.stringBuilder.toString());

    // visitar cada declaracao de funcao 
    isFunctionDeclaration = true;
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration()) {
            // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            
            // visita apenas declaracao de funcao
            this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
            
            // coloca codigo gerado no array
            generatedCode.push(this.stringBuilder.toString());
          }
      }   
    }
    
    return generatedCode;
  }
}