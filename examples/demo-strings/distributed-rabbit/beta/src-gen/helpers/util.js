import amqp from 'amqplib';
import {
    v4 as uuidv4
} from 'uuid';
async function toUpperCaseString(str) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://myrabbit:5672");

            console.log("Connection established!");
            console.log("Sending call to function toUpperCaseString");
            const channel = await connection.createChannel();

            const q = await channel.assertQueue('', {
                exclusive: true,
            });

            const queueName = "toUpperCaseString_queue";

            console.log("Declaring queue: " + queueName);
            const correlationId = uuidv4();

            const callObj = {
                funcName: "toUpperCaseString",
                parameters: {
                    str: str
                },
            };

            channel.consume(q.queue, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Receiving response for function toUpperCaseString");
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
            console.log("Sending message to queue: toUpperCaseString_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)), {
                correlationId: correlationId,
                replyTo: q.queue
            });
        } catch (error) {
            console.error("Error processing call to function toUpperCaseString:", error);
            reject(error);
        }
    });
    return p;
}

function toLowerCaseString(str) {
    console.log("Estou no toLowerCaseString");
    return str.toLowerCase();
}
export {
    toUpperCaseString,
    toLowerCaseString
};
export {
    toLowerCaseString as toLowerCaseString_localRef
};