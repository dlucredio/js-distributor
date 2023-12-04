// gera lista aleatoriamente e ordena

function main() {
    const lista = sorteiaLista();
    const listaOrdenada = insertionSort(lista);
    console.log("lista ordenada: ", listaOrdenada);

    return 'sucesso';
}

// sorteia numero entre 2 e n
function sorteiaNumero(n) {
    return Math.floor(Math.random() * n) + 2;

}

// retorna uma lista aleatoria de tamanho "tam" e elementos entre 1 e 100
function sorteiaLista() {
    const tam = sorteiaNumero(20);
    const lista = [];
    for (let i = 0; i < tam; i++) {
        lista.push(Math.floor(Math.random() * 100) + 1);
    }

    return lista;
}

function insertionSort(inputArr) {
    let n = inputArr.length;
        for (let i = 1; i < n; i++) {
            // Choosing the first element in our unsorted subarray
            let current = inputArr[i];
            // The last element of our sorted subarray
            let j = i-1; 
            while ((j > -1) && (current < inputArr[j])) {
                inputArr[j+1] = inputArr[j];
                j--;
            }
            inputArr[j+1] = current;
        }
    imprimeLista("resultado da lista ordenada:", inputArr);
    return inputArr;
}

function imprimeLista(msg, lista) {
    console.log(msg, lista);
}