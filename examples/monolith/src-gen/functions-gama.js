import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function sub(a, b) {
    let body = {
        a: a,
        b: b,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:3001/sub', {
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