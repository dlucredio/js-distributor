function main() {
    const lista = sorteiaLista();
    const listaOrdenada = ordenaListas(lista, 'selectionSort', 'selection sort');
    console.log("lista ordenada: ", listaOrdenada);
    return 'sucesso';
}

function ordenaListas(lista, metodo, msg) {
    console.log('ordenacao feita pelo metodo ', msg);
    if (metodo == 'selectionSort')
        return selectionSort(lista);
    else(metodo == 'insertionSort');
    return insertionSort(lista);
}

function selectionSort(arr) {
    var n = arr.length;
    for (var i = 0; i < n - 1; i++) {
        var minIndex = i;

        for (var j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        var temp = arr[minIndex];

        arr[minIndex] = arr[i];
        arr[i] = temp;
    }
    return arr;
}

function sorteiaNumero(n, argTeste) {
    console.log(argTeste);
    return Math.floor(Math.random() * n) + 2;
}

function sorteiaLista() {
    const tam = sorteiaNumero(20, "argumento de teste chegou");
    const lista = [];
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
    imprimeLista("resultado da lista ordenada:", inputArr);
    return inputArr;
}

function imprimeLista(msg, lista) {
    console.log(msg, lista);
    console.log("funcao de teste retornou: ", deTeste());
}

function deTeste() {
    return True;
}