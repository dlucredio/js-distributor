const fs = require('fs');
const beautify = require('js-beautify').js;

// le arquivo e retorna seu conteudo
function lerArquivo(caminhoArquivo) {
  return fs.readFileSync(caminhoArquivo, 'utf8');
}

// retorna codigo formatado
function formatarCodigo(codigo) {
  return beautify(codigo, {
    indent_size: 4,
    space_in_empty_paren: true,
    preserve_newlines: false,
  })
}

// faz o teste entre arquivos
describe('Comparação de arquivos JavaScript', () => {
  it('Deve comparar se o conteúdo de arquivo_x.js é idêntico a arquivo_y.js após a formatação', () => {
    const caminhoArquivoX = './src/Import.js';
    const caminhoArquivoY = './src-gen/Import.js';

    // lendo e formatando conteudos dos arquivos
    const conteudoX = formatarCodigo(lerArquivo(caminhoArquivoX));
    const conteudoY = formatarCodigo(lerArquivo(caminhoArquivoY));

    // Realizar a comparação dos conteúdos
    expect(conteudoY).toBe(conteudoX);
  });
});