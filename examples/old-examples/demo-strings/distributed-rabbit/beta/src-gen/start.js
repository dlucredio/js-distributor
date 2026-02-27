import amqp from 'amqplib';
import {
    toLowerCaseString_localRef as toLowerCaseString
} from "./helpers/util.js";
async function waitForCalls() {
    const connection = await amqp.connect("amqp://myrabbit:5672");
    console.log("Waiting for calls via RabbitMQ on port 5672");
    const channel = await connection.createChannel();
    const toLowerCaseString_queueName = "toLowerCaseString_queue";
    await channel.assertQueue(toLowerCaseString_queueName, {
        durable: false
    });
    channel.consume(toLowerCaseString_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message_call_received = JSON.parse(msg.content.toString());
            if (message_call_received.funcName === "toLowerCaseString") {
                const {
                    str
                } = message_call_received.parameters;

                console.log("Calling function toLowerCaseString", str);
                const result_toLowerCaseString = toLowerCaseString(str);

                const response_toLowerCaseString = {
                    funcName: "toLowerCaseString",
                    result: result_toLowerCaseString
                };

                console.log("Sending response to function toLowerCaseString");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_toLowerCaseString)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();