import fetch from 'node-fetch';
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