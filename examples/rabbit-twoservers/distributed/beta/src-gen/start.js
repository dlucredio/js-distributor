import amqp from 'amqplib';
import {
    toUpperCase_localRef as toUpperCase
} from "./main.js";
async function waitForCalls() {
    const connection = await amqp.connect("amqp://myrabbit:5672");
    console.log("Waiting for calls via RabbitMQ on port 5672");
    const channel = await connection.createChannel();
    const toUpperCase_queueName = "toUpperCase_queue";
    await channel.assertQueue(toUpperCase_queueName, {
        durable: false
    });
    channel.consume(toUpperCase_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "toUpperCase") {
                const {
                    s
                } = message.parameters;

                console.log("Calling function toUpperCase", s);
                const result_toUpperCase = toUpperCase(s);

                const response_toUpperCase = {
                    funcName: "toUpperCase",
                    result: result_toUpperCase
                };

                console.log("Sending response to function toUpperCase");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_toUpperCase)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();