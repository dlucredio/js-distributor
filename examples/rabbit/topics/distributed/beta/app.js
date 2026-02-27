import amqp from 'amqplib';
import {
    v4 as uuidv4_js_dist
} from 'uuid';
async function main() {
    const data = [8, 3, 5, 1, 9, 2];
    console.log("\n--- MERGE SORT ---");
    console.log("Original array:", data);
    console.log("================================");
    const mergeResult = mergeSort(data, 0);
    console.log("Merge result:", mergeResult);
    console.log("\n--- QUICK SORT ---");
    console.log("Original array:", data);
    console.log("================================");
    const quickResult = await quickSort(data, 0);
    console.log("Quick result:", quickResult);
    console.log("\nOriginal array after execution:", data);
}

function mergeSort(arr, depth) {
    console.log(`${indent(depth)}mergeSort(${JSON.stringify(arr)})`);
    if (arr.length <= 1) {
        console.log(`${indent(depth)}return`, arr);
        return arr;
    }
    const middle = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, middle), depth + 1);
    const right = mergeSort(arr.slice(middle), depth + 1);
    const merged = merge(left, right, depth);
    console.log(`${indent(depth)}merged ->`, merged);
    return merged;
}

function merge(left, right, depth) {
    console.log(`${indent(depth)}merge ${JSON.stringify(left)} + ${JSON.stringify(right)}`);
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    return [...result, ...left.slice(i), ...right.slice(j)];
}
async function quickSort(arr, depth) {
    {
        const p = new Promise(async (resolve, reject) => {
            try {
                console.log("Connecting to RabbitMQ...");
                const connection = await amqp.connect("amqp://localhost:5672");
                console.log("Connection established!");
                console.log("Sending call to function quickSort");
                const channel = await connection.createChannel();
                const q = await channel.assertQueue('', {
                    exclusive: true
                });
                const quickSort_exchange = 'sortExchange';
                await channel.assertExchange(quickSort_exchange, 'topic', {
                    durable: false
                });
                const correlationId = uuidv4_js_dist();
                const callObj = {
                    funcName: "quickSort",
                    parameters: {
                        arr: arr,
                        depth: depth
                    }
                };
                channel.consume(q.queue, msg => {
                    if (msg) {
                        const message = JSON.parse(msg.content.toString());
                        console.log("Receiving response for function quickSort");
                        if (msg.properties.correlationId === correlationId) {
                            const result = message.result;
                            console.log("Response received:", result);
                            resolve(result);
                            channel.cancel(msg.fields.consumerTag);
                        }
                    }
                }, {
                    noAck: true
                });
                channel.publish(quickSort_exchange, 'sort.quick', Buffer.from(JSON.stringify(callObj)), {
                    correlationId: correlationId,
                    replyTo: q.queue
                });
            } catch (error) {
                console.error("Error processing call to function quickSort:", error);
                reject(error);
            }
        });
        return p;
    }
}

function indent(depth) {
    return "  ".repeat(depth);
}
async function logSortCall(arr) {
    {
        const p = new Promise(async (resolve, reject) => {
            try {
                console.log("Connecting to RabbitMQ...");
                const connection = await amqp.connect("amqp://localhost:5672");
                console.log("Connection established!");
                console.log("Sending call to function logSortCall");
                const channel = await connection.createChannel();
                const q = await channel.assertQueue('', {
                    exclusive: true
                });
                const logSortCall_exchange = 'sortExchange';
                await channel.assertExchange(logSortCall_exchange, 'topic', {
                    durable: false
                });
                const correlationId = uuidv4_js_dist();
                const callObj = {
                    funcName: "logSortCall",
                    parameters: {
                        arr: arr
                    }
                };
                channel.consume(q.queue, msg => {
                    if (msg) {
                        const message = JSON.parse(msg.content.toString());
                        console.log("Receiving response for function logSortCall");
                        if (msg.properties.correlationId === correlationId) {
                            const result = message.result;
                            console.log("Response received:", result);
                            resolve(result);
                            channel.cancel(msg.fields.consumerTag);
                        }
                    }
                }, {
                    noAck: true
                });
                channel.publish(logSortCall_exchange, 'sort.*', Buffer.from(JSON.stringify(callObj)), {
                    correlationId: correlationId,
                    replyTo: q.queue
                });
            } catch (error) {
                console.error("Error processing call to function logSortCall:", error);
                reject(error);
            }
        });
        return p;
    }
}
export default main;
export {
    mergeSort as mergeSort_localRef
};