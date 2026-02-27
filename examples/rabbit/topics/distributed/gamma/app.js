import amqp from 'amqplib';
import {
    v4 as uuidv4_js_dist
} from 'uuid';
async function main() {
    const data = [8, 3, 5, 1, 9, 2];
    console.log("\n--- MERGE SORT ---");
    console.log("Original array:", data);
    console.log("================================");
    const mergeResult = await mergeSort(data, 0);
    console.log("Merge result:", mergeResult);
    console.log("\n--- QUICK SORT ---");
    console.log("Original array:", data);
    console.log("================================");
    const quickResult = quickSort(data, 0);
    console.log("Quick result:", quickResult);
    console.log("\nOriginal array after execution:", data);
}
async function mergeSort(arr, depth) {
    {
        const p = new Promise(async (resolve, reject) => {
            try {
                console.log("Connecting to RabbitMQ...");
                const connection = await amqp.connect("amqp://localhost:5672");
                console.log("Connection established!");
                console.log("Sending call to function mergeSort");
                const channel = await connection.createChannel();
                const q = await channel.assertQueue('', {
                    exclusive: true
                });
                const mergeSort_exchange = 'sortExchange';
                await channel.assertExchange(mergeSort_exchange, 'topic', {
                    durable: false
                });
                const correlationId = uuidv4_js_dist();
                const callObj = {
                    funcName: "mergeSort",
                    parameters: {
                        arr: arr,
                        depth: depth
                    }
                };
                channel.consume(q.queue, msg => {
                    if (msg) {
                        const message = JSON.parse(msg.content.toString());
                        console.log("Receiving response for function mergeSort");
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
                channel.publish(mergeSort_exchange, 'sort.merge', Buffer.from(JSON.stringify(callObj)), {
                    correlationId: correlationId,
                    replyTo: q.queue
                });
            } catch (error) {
                console.error("Error processing call to function mergeSort:", error);
                reject(error);
            }
        });
        return p;
    }
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

function quickSort(arr, depth) {
    console.log(`${indent(depth)}quickSort(${JSON.stringify(arr)})`);
    if (arr.length <= 1) {
        console.log(`${indent(depth)}return`, arr);
        return arr;
    }
    const pivot = arr[arr.length - 1];
    const left = [];
    const right = [];
    console.log(`${indent(depth)}pivot = ${pivot}`);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    console.log(`${indent(depth)}left=${JSON.stringify(left)} right=${JSON.stringify(right)}`);
    const result = [...quickSort(left, depth + 1), pivot, ...quickSort(right, depth + 1)];
    console.log(`${indent(depth)}combined ->`, result);
    return result;
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
    quickSort as quickSort_localRef
};