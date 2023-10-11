import CopyPasteGenerator from "./copypaste-generator.js";
import { StringBuilder } from "./generator-utils.js";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

// variavel global para permitir ou nao declaracao da funcao
let isFunctionDeclaration = false;

export default class FunctionGenerator extends CopyPasteGenerator {
  constructor() {
    super();
  }

  /* 
    sobreposicao de visitFunctionDeclaration   
  */
  visitFunctionDeclaration(ctx) {
    if(isFunctionDeclaration) {
        super.visitFunctionDeclaration(ctx);
    } 
    // else {
    //   this.appendString("async ");
    //   this.appendString("function ");
    //   this.appendString(ctx.identifier().getText());
    //   this.appendString("(");
    //   if (ctx.formalParameterList()) this.visitFormalParameterList(ctx.formalParameterList());
    //   this.appendString(")");
    //   this.visitFunctionBody(ctx.functionBody());
    // }
  }

  /*
    achar jeito de porta do servidor correspondente a funcao seja passada (?)
    validar para ver se corresponde a um corpo de funcao que deve ser dessa forma (senao outras funcoes
    serao afetadas)

      usar arquivo yml/yaml ou json

    modelo usado:
    async function sum(a, b) {
    const response = await
    fetch('http://localhost:3000?num1=' + a +
    '&num2=' + b);
    const result = await response.json();
    return result;
  } 
  */
  // visitFunctionBody(ctx) {
  //   if(!isFunctionDeclaration) {  
  //     this.appendString("{");
  //     this.appendString('const response = await');
  //     this.appendString(`fetch('http://localhost:porta;`);
  //     this.appendString("const result = await response.json();");
  //     this.appendString("return result");
  //     this.appendString("}");
  //   }
  // }

  /* 
    funcao em que chamadas de funcoes sao feitas
    - necessario fazer uma validacao para testar se determinada chamada deve ter o await ou nao (se for chamada
      para funcao do servidor deve ter)
  */
  // visitArgumentsExpression(ctx) {
  //   this.appendString("await ");
  //   super.visitArgumentsExpression(ctx);
  // }

  generateFunctions(ctx) {
    const yamlPath = path.resolve("..", "..", "distributor", "src", "utils.yml");
    try {
      const utils = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
      console.log('Configurações do arquivo YAML:', utils);
    } catch (e) {
      console.error('Erro ao carregar o arquivo YAML:', e);
    }

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

// {

    // definicao de servers com urls, porta, etc
    // definicao de funcoes, seu argumentos e o server


// }