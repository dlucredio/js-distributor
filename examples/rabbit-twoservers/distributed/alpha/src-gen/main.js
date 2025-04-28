import amqp from 'amqplib';
import {
    v4 as uuidv4
} from 'uuid';
export async function main() {
    console.log("Inside function main()");
    const text = "hello world!";
    console.log(`Initial text: ${text}`);
    const upperCaseText = await toUpperCase(text);
    console.log(`Transformed text: ${upperCaseText}`);
    console.log("Done");
}
async function toUpperCase(s) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://myrabbit:5672");

            console.log("Connection established!");
            console.log("Sending call to function toUpperCase");
            const channel = await connection.createChannel();

            const q = await channel.assertQueue('', {
                exclusive: true,
            });

            const queueName = "toUpperCase_queue";

            console.log("Declaring queue: " + queueName);
            const correlationId = uuidv4();

            const callObj = {
                funcName: "toUpperCase",
                parameters: {
                    s: s
                },
            };

            channel.consume(q.queue, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function toUpperCase");
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
            console.log("Sending message to queue: toUpperCase_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                correlationId: correlationId,
                replyTo: q.queue
            });
        } catch (error) {
            console.error("Error processing call to function toUpperCase:", error);
            reject(error);
        }
    });
    return p;
}
export {
    main as main_localRef
};