function main() {
    const lista = sorteiaLista()
    const listaOrdenada = insertionSort(lista);
    console.log("lista ordenada: ", listaOrdenada);
}

function sorteiaNumero() {
    return Math.floor(Math.random() * 20) + 2;
}

function sorteiaLista() {
    const lista = [];
    const tam = sorteiaNumero();
    for (let i = 0; i < tam; i++) {
        lista.push(Math.floor(Math.random() * 100) + 1);
    }
    return lista;
}

function insertionSort(inputArr) {
    let n = inputArr.length;
    for (let i = 1; i < n; i++) {
        let current = inputArr[i];

        let j = i - 1;

        while ((j > -1) && (current < inputArr[j])) {
            inputArr[j + 1] = inputArr[j];
            j--;
        }
        inputArr[j + 1] = current;
    }
    return inputArr;
}
main();