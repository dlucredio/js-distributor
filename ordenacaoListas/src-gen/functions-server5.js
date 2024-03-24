import fetch from 'node-fetch';
import amqp from 'amqplib';
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
export async function calcularBhaskara(a, b, c) {
    const response = await fetch('http://localhost:3333/calcularBhaskara?a=' + a + '&b=' + b + '&c=' + c);
    const {
        result
    } = await response.json();
    return result;
}
export async function randomZeroUm() {
    const response = await fetch('http://localhost:3333/randomZeroUm', {
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