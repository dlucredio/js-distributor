import amqp from 'amqplib';
import {
    toUpperCaseString_localRef as toUpperCaseString
} from "./helpers/util.js";
async function waitForCalls() {
    const connection = await amqp.connect("amqp://myrabbit:5672");
    console.log("Waiting for calls via RabbitMQ on port 5672");
    const channel = await connection.createChannel();
    const toUpperCaseString_queueName = "toUpperCaseString_queue";
    await channel.assertQueue(toUpperCaseString_queueName, {
        durable: false
    });
    channel.consume(toUpperCaseString_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message_call_received = JSON.parse(msg.content.toString());
            if (message_call_received.funcName === "toUpperCaseString") {
                const {
                    str
                } = message_call_received.parameters;

                console.log("Calling function toUpperCaseString", str);
                const result_toUpperCaseString = toUpperCaseString(str);

                const response_toUpperCaseString = {
                    funcName: "toUpperCaseString",
                    result: result_toUpperCaseString
                };

                console.log("Sending response to function toUpperCaseString");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_toUpperCaseString)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();