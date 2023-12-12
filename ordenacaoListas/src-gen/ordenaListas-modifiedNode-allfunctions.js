import fetch from 'node-fetch';
export async function main() {
    const response = await fetch('http://localhost:3000/main');
    const {
        result
    } = await response.json();
    return result;
}
export async function ordenaListas(lista, metodo, msg) {
    let body = {
        lista: lista,
        metodo: metodo,
        msg: msg,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:3333/ordenaListas', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function selectionSort(arr) {
    let body = {
        arr: arr,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:2222/selectionSort', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function sorteiaNumero(n, argTeste) {
    const response = await fetch('http://localhost:5000/sorteiaNumero?n=' + n + '&argTeste=' + argTeste);
    const {
        result
    } = await response.json();
    return result;
}
export async function sorteiaLista() {
    const response = await fetch('http://localhost:1111/sorteiaLista', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function insertionSort(inputArr) {
    let body = {
        inputArr: inputArr,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:2222/insertionSort', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function imprimeLista(msg, lista) {
    let body = {
        msg: msg,
        lista: lista,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:3333/imprimeLista', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function deTeste() {
    const response = await fetch('http://localhost:3333/deTeste');
    const {
        result
    } = await response.json();
    return result;
}