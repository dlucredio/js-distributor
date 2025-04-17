import amqp from 'amqplib';
import {
    v4 as uuidv4
} from 'uuid';
export function toLowerCase(str) {
    console.log("toLowerCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (code >= 65 && code <= 90) {
            result += String.fromCharCode(code + 32);
        } else {
            result += str[i];
        }
    }
    return result;
}
export function toUpperCase(str) {
    console.log("toUpperCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (code >= 97 && code <= 122) {
            result += String.fromCharCode(code - 32);
        } else {
            result += str[i];
        }
    }
    return result;
}
export async function split(str, separator = ",") {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost:5672");

            console.log("Connection established!");
            console.log("Sending call to function split");
            const channel = await connection.createChannel();

            const q = await channel.assertQueue('', {
                exclusive: true,
            });

            const queueName = "split_queue";

            console.log("Declaring queue: " + queueName);
            const correlationId = uuidv4();

            const callObj = {
                funcName: "split",
                parameters: {
                    str: str,
                    separator: separator
                }
            };

            channel.consume(q.queue, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function split");
                    if (msg.properties.correlationId === correlationId) {
                        const result = message.result;

                        console.log("Response received:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Sending message to queue: split_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                correlationId: correlationId,
                replyTo: q.queue
            });
        } catch (error) {
            console.error("Error processing call to function split:", error);
            reject(error);
        }
    });
    return p;
}
export async function join(arr, separator = ',') {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost:5672");

            console.log("Connection established!");
            console.log("Sending call to function join");
            const channel = await connection.createChannel();

            const q = await channel.assertQueue('', {
                exclusive: true,
            });

            const queueName = "join_queue";

            console.log("Declaring queue: " + queueName);
            const correlationId = uuidv4();

            const callObj = {
                funcName: "join",
                parameters: {
                    arr: arr,
                    separator: separator
                }
            };

            channel.consume(q.queue, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function join");
                    if (msg.properties.correlationId === correlationId) {
                        const result = message.result;

                        console.log("Response received:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Sending message to queue: join_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                correlationId: correlationId,
                replyTo: q.queue
            });
        } catch (error) {
            console.error("Error processing call to function join:", error);
            reject(error);
        }
    });
    return p;
}