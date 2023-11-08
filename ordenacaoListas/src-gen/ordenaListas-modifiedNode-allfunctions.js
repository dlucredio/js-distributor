function main() {
    const response = fetch('http://main:3000/main');
    const result = response.json();
    return result;
}

function sorteiaNumero() {
    const response = fetch('http://random:5000/sorteiaNumero');
    const result = response.json();
    return result;
}

function sorteiaLista() {
    const response = fetch('http://random:5000/sorteiaLista');
    const result = response.json();
    return result;
}

function insertionSort(inputArr) {
    const response = fetch('http://sort:8080/insertionSort');
    const result = response.json();
    return result;
}
main();