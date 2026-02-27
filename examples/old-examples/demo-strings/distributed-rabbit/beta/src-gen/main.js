import amqp from 'amqplib';
import {
    v4 as uuidv4
} from 'uuid';
import {
    toLowerCaseString,
    toUpperCaseString as tuc
} from './helpers/util.js';
export async function main() {
    const response = await fetch(`http://localhost:3000/main`);
    const {
        result
    } = await response.json();
    return result;
}
async function print(message_arg) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://myrabbit:5672");

            console.log("Connection established!");
            console.log("Sending call to function print");
            const channel = await connection.createChannel();

            const q = await channel.assertQueue('', {
                exclusive: true,
            });

            const queueName = "print_queue";

            console.log("Declaring queue: " + queueName);
            const correlationId = uuidv4();

            const callObj = {
                funcName: "print",
                parameters: {
                    message_arg: message_arg
                },
            };

            channel.consume(q.queue, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function print");
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
            console.log("Sending message to queue: print_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                correlationId: correlationId,
                replyTo: q.queue
            });
        } catch (error) {
            console.error("Error processing call to function print:", error);
            reject(error);
        }
    });
    return p;
}