import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function insertUser(email, name) {
    let body = {
        email: email,
        name: name,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:3001/insertUser', {
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
export async function findUserByEmail(email) {
    const response = await fetch('http://localhost:3001/findUserByEmail?email=' + email);
    const {
        result
    } = await response.json();
    return result;
}