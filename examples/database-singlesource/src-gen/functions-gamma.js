import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function deleteAllUsers() {
    const response = await fetch('http://localhost:3002/deleteAllUsers');
    const {
        result
    } = await response.json();
    return result;
}