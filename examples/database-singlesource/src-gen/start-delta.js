import express from 'express';
const app = express();
const port = 3003;
app.use(express.json());
app.listen(port, () => {
  console.log('Server running in port ' + port);
});
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import pkg from 'pg';
const { Client } = pkg ;
const connectionString  = 'postgresql://db:db@localhost:5432/db';

async function waitForCalldelta() {
    const connection = await amqp.connect("amqp://localhost");
    console.log("Waiting for calls");
    const channel = await connection.createChannel();
    let queueName = "delta_queue";
    await channel.assertQueue(queueName, {
        durable: false
    });
    channel.consume(queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "generateKey" && message.type === "call") {
                const {
                    prefix,
                } = message.parameters;
                console.log("Calling function generateKey", prefix, );
                const resultgenerateKey = await generateKey(prefix, );
                const responsegenerateKey = {
                    funcName: "generateKey",
                    type: "response",
                    result: resultgenerateKey,
                };
                console.log("Sending response to function generateKey");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responsegenerateKey)));
            }
        }
    }, {
        noAck: true
    });
}
waitForCalldelta();

function generateKey(prefix, ) {
    console.log(`Generating key with prefix '${prefix}'`);
    const key = prefix + ":::" + uuidv4();
    return key;
}