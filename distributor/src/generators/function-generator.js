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
    try {
      const yamlPath = path.resolve('..', '..', 'distributor', 'src', 'config.yml')
      const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
      this.servers = config.servers
      this.functions = config.functions
      this.numServers = this.servers.length
    } catch (e) {
      console.error('Erro ao carregar o arquivo YAML:', e);
    }
  }

  /* 
    sobreposicao de visitFunctionDeclaration   
  */
  visitFunctionDeclaration(ctx, serverId) {
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

    /*
      todos codigos gerados:
        - posicao 0: codigo de entrada com chamadas para funcoes no servidor
        - posicao i | i != 0: definicoes de funcoes no server i
    */
    const generatedCode = new Array(this.numServers + 1);
    console.log('---->', this.numServers + 1)

    // visitar programa para gerar codigo do arquivo de entrada sem declaracao da funcao
    this.visitProgram(ctx);

    // colocar codigo gerado em array
    generatedCode[0] = this.stringBuilder.toString();

    // visitar cada declaracao de funcao 
    isFunctionDeclaration = true;
    if (ctx.sourceElements()) {
      const sourceElements = ctx.sourceElements().children;
      for (let i in sourceElements) {
          if (sourceElements[i].statement().functionDeclaration()) {
            // // reinicio de stringBuilder
            this.stringBuilder = new StringBuilder();
            for (let funct of this.functions) {
              if (funct.name === sourceElements[i].statement().functionDeclaration().identifier().getText()) {
                console.log('achou funcao de nome',funct.name, funct.server)
                this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration(), funct.server);
                if (generatedCode[funct.server]){
                  console.log("entrou aqui", funct.name)
                  generatedCode[funct.server] += this.stringBuilder.toString();
                }
                else {
                  generatedCode[funct.server] = this.stringBuilder.toString();
                }
              }
            }
            
            
            // // visita apenas declaracao de funcao
            // this.visitFunctionDeclaration(sourceElements[i].statement().functionDeclaration());
            
            // // coloca codigo gerado no array
            // generatedCode.push(this.stringBuilder.toString());

            // lembrar de fazer toString 
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