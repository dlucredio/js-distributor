import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function entryPoint() {
    const response = await fetch('http://localhost:3000/entryPoint');
    const {
        result
    } = await response.json();
    return result;
}