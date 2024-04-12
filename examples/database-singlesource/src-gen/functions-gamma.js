import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function generateKey(prefix) {
    const response = await fetch('http://localhost:3002/generateKey?prefix=' + prefix + '&undefined=' + undefined);
    const {
        result
    } = await response.json();
    return result;
}