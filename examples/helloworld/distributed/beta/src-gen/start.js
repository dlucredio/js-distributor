import amqp from 'amqplib';
import {
    log_localRef as log
} from "./util/lists.js";
import {
    split_localRef as split
} from "./util/strings.js";
async function waitForCalls() {
    const connection = await amqp.connect("amqp://localhost:5672");
    console.log("Waiting for calls via RabbitMQ on port 5672");
    const channel = await connection.createChannel();
    const log_queueName = "log_queue";
    await channel.assertQueue(log_queueName, {
        durable: false
    });
    channel.consume(log_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message_call_received = JSON.parse(msg.content.toString());
            if (message_call_received.funcName === "log") {
                const {
                    list
                } = message_call_received.parameters;

                console.log("Calling function log", list);
                const result_log = log(list);

                const response_log = {
                    funcName: "log",
                    result: result_log
                };

                console.log("Sending response to function log");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_log)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
    const split_queueName = "split_queue";
    await channel.assertQueue(split_queueName, {
        durable: false
    });
    channel.consume(split_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message_call_received = JSON.parse(msg.content.toString());
            if (message_call_received.funcName === "split") {
                const {
                    str,
                    separator
                } = message_call_received.parameters;

                console.log("Calling function split", str, separator);
                const result_split = split(str, separator);

                const response_split = {
                    funcName: "split",
                    result: result_split
                };

                console.log("Sending response to function split");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_split)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();