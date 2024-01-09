// Função para somar dois números
function somarNumeros(a, b) {
    return a + b;
}

// Função para verificar se um número é par
function ehPar(numero) {
    return numero % 2 === 0;
}

export function multiplicaNumeros(a, b) {
    return a*b;
}

function doisValores(a, b) {
    console.log("valores a, b = ", a, b);
    console.log("a soma eh", somarNumeros(a, b));
    console.log("a mult eh", multiplicaNumeros(a,b));

    let teste = function() {
        console.log('a, b, a eh par?');
        imprimeTresValores(a, b, ehPar(a));
    }

    let teste2 = function() {
        console.log("apenas um teste de funcao anonima");
    }

    teste();
    console.log("a eh par?", ehPar(a));
    console.log("b eh par?", ehPar(b));
}

// Função para inverter uma string
function inverterString(str) {
    return str.split('').reverse().join('');
}

function imprimeTresValores(value1, value2, value3) {
    let teste = function(valor) {
        console.log(valor)
    }
    teste(value1);
    teste(value2);
    teste(value3);
}

function calculaQuadrado(a) {
    return multiplicaNumeros(a, a);
}