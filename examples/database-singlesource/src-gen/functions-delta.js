import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function generateKey(prefix, ) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Connection established!");
            console.log("Sending call to function generateKey");
            const channel = await connection.createChannel();
            let queueName = "delta_queue";
            console.log("Declaring queue: delta_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "generateKey",
                type: "call",
                parameters: {
                    prefix: prefix,
                    undefined: undefined,
                },
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function generateKey");
                    if (message.funcName === "generateKey" && message.type === "response") {
                        const result = message.result;
                        console.log("Response received:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Sending message to queue: delta_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Error processing call to function generateKey:", error);
            reject(error);
        }
    });
    return p;
}