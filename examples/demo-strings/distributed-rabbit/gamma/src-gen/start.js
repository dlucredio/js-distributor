import amqp from 'amqplib';
import {
    print_localRef as print
} from "./main.js";
async function waitForCalls() {
    const connection = await amqp.connect("amqp://myrabbit:5672");
    console.log("Waiting for calls via RabbitMQ on port 5672");
    const channel = await connection.createChannel();
    const print_queueName = "print_queue";
    await channel.assertQueue(print_queueName, {
        durable: false
    });
    channel.consume(print_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message_call_received = JSON.parse(msg.content.toString());
            if (message_call_received.funcName === "print") {
                const {
                    message_arg
                } = message_call_received.parameters;

                console.log("Calling function print", message_arg);
                const result_print = print(message_arg);

                const response_print = {
                    funcName: "print",
                    result: result_print
                };

                console.log("Sending response to function print");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_print)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();