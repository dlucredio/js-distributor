import express from 'express';
import amqp from 'amqplib';
import {
    main_localRef as main
} from "./main.js";
import {
    join_localRef as join
} from "./util/strings.js";
const app = express();
const port = 3002;
app.use(express.json());
app.get('/main', async (req, res) => {
    const result = await main();
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});
async function waitForCalls() {
    const connection = await amqp.connect("amqp://localhost:5672");
    console.log("Waiting for calls via RabbitMQ on port 5672");
    const channel = await connection.createChannel();
    const join_queueName = "join_queue";
    await channel.assertQueue(join_queueName, {
        durable: false
    });
    channel.consume(join_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "join") {
                const {
                    arr,
                    separator
                } = message.parameters;

                console.log("Calling function join", arr, separator);
                const result_join = join(arr, separator);

                const response_join = {
                    funcName: "join",
                    result: result_join
                };

                console.log("Sending response to function join");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_join)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();