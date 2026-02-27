import amqp from 'amqplib';
import {
    logSortCall_localRef as logSortCall
} from "./app.js";
async function waitForCalls() {
    try {
        const rabbitConnectionURL = "amqp://localhost:5672";
        const connection = await tryToConnectToRabbit(rabbitConnectionURL, 5, 10);
        console.log("Waiting for calls via RabbitMQ on port 5672");
        const channel = await connection.createChannel();

        // RabbitMQ consumers

        const logSortCall_queueName = "logSortCallQueueTopic";

        // This function has an exchange, let's use it

        const logSortCall_exchange = 'sortExchange';
        await channel.assertExchange(logSortCall_exchange, 'topic', {
            durable: false
        });
        const queue_logSortCall = await channel.assertQueue(logSortCall_queueName, {
            exclusive: true
        });
        await channel.bindQueue(queue_logSortCall.queue, logSortCall_exchange, 'sort.*');
        channel.consume(queue_logSortCall.queue, async msg => {
            if (msg) {
                console.log("Receiving call");
                const message_call_received = JSON.parse(msg.content.toString());
                const {
                    arr
                } = message_call_received.parameters;
                console.log("Calling function logSortCall", arr);
                const result_logSortCall = logSortCall(arr);
            }
        }, {
            noAck: true
        });
    } catch (error) {
        console.log("Could not connect to RabbitMQ");
    }
}
async function tryToConnectToRabbit(rabbitConnectionURL, numConnectionAttempts, timeBetweenAttempts) {
    const maxRetries = numConnectionAttempts;
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            const connection = await amqp.connect(rabbitConnectionURL);
            console.log("Connection with RabbitMQ established");
            return connection;
        } catch (error) {
            attempts++;
            console.log("Error connecting to Rabbit service at " + rabbitConnectionURL);
            if (attempts < maxRetries) {
                console.log('Retrying in ' + timeBetweenAttempts + ' seconds...');
                await new Promise(resolve => setTimeout(resolve, timeBetweenAttempts * 1000));
            } else {
                console.log('Max retries reached. Could not connect to Rabbit service.');
                throw error;
            }
        }
    }
}
waitForCalls();