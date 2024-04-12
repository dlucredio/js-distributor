import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function generateKey(prefix) {
    let body = {
        prefix: prefix,
        undefined: undefined,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:3002/generateKey', {
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