import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function sorteiaLista() {
    const response = await fetch('http://localhost:4444/sorteiaLista', {
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
export async function somarNumeros(a, b) {
    const response = await fetch('http://localhost:4444/somarNumeros?a=' + a + '&b=' + b);
    const {
        result
    } = await response.json();
    return result;
}
export async function ehPar(numero) {
    let body = {
        numero: numero,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:4444/ehPar', {
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
export async function multiplicaListaPassada(lista) {
    let body = {
        lista: lista,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:4444/multiplicaListaPassada', {
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