import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function isAEqualToB(a, b) {
    const response = await fetch('http://localhost:3000/isAEqualToB?a=' + a + '&b=' + b);
    const {
        result
    } = await response.json();
    return result;
}