import amqp from 'amqplib';
import {
    v4 as uuidv4_js_dist
} from 'uuid';
async function main_merge() {
    console.log("\n--- MERGE SORT ---");
    const data = [8, 3, 5, 1, 9, 2];
    console.log("Original array:", data);
    console.log("================================");
    const mergeResult = await sortArray(data, "merge");
    console.log("Merge result:", mergeResult);
    console.log("\nOriginal array after execution:", data);
}
async function main_quick() {
    const response = await fetch(`http://localhost:3001/main_quick`);
    const {
        executionResult
    } = await response.json();
    return executionResult;
}
async function sortArray(array, algorithm = "merge") {
    {
        const p = new Promise(async (resolve, reject) => {
            try {
                console.log("Connecting to RabbitMQ...");
                const connection = await amqp.connect("amqp://localhost:5672");
                console.log("Connection established!");
                console.log("Sending call to function sortArray");
                const channel = await connection.createChannel();
                const q = await channel.assertQueue('', {
                    exclusive: true
                });
                const queueName = "sortArrayRPCQueue";
                console.log("Declaring queue: " + queueName);
                const correlationId = uuidv4_js_dist();
                const callObj = {
                    funcName: "sortArray",
                    parameters: {
                        array: array,
                        algorithm: algorithm
                    }
                };
                channel.consume(q.queue, msg => {
                    if (msg) {
                        const message = JSON.parse(msg.content.toString());
                        console.log("Receiving response for function sortArray");
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
                console.log("Sending message to queue: sortArrayRPCQueue");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                    correlationId: correlationId,
                    replyTo: q.queue
                });
            } catch (error) {
                console.error("Error processing call to function sortArray:", error);
                reject(error);
            }
        });
        return p;
    }
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
async function main() {
    await main_merge();
    await main_quick();
}
export default main;
export {
    main_merge as main_merge_localRef
};