import amqp from 'amqplib';
import {
    v4 as uuidv4
} from 'uuid';

function push(list, element) {
    console.log("Pushing ...");
    list.push(element);
}
export async function log(list) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost:5672");

            console.log("Connection established!");
            console.log("Sending call to function log");
            const channel = await connection.createChannel();

            const q = await channel.assertQueue('', {
                exclusive: true,
            });

            const queueName = "log_queue";

            console.log("Declaring queue: " + queueName);
            const correlationId = uuidv4();

            const callObj = {
                funcName: "log",
                parameters: {
                    list: list
                },
            };

            channel.consume(q.queue, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function log");
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
            console.log("Sending message to queue: log_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                correlationId: correlationId,
                replyTo: q.queue
            });
        } catch (error) {
            console.error("Error processing call to function log:", error);
            reject(error);
        }
    });
    return p;
}
export default {
    push
};