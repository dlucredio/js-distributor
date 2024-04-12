import fetch from 'node-fetch';
import amqp from 'amqplib';
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
export async function deTeste(booleano) {
    const response = await fetch('http://localhost:2222/deTeste?booleano=' + booleano);
    const {
        result
    } = await response.json();
    return result;
}