import amqp from 'amqplib';
import {
    quickSort_localRef as quickSort
} from "./app.js";
async function waitForCalls() {
    try {
        const rabbitConnectionURL = "amqp://localhost:5672";
        const connection = await tryToConnectToRabbit(rabbitConnectionURL, 5, 10);
        console.log("Waiting for calls via RabbitMQ on port 5672");
        const channel = await connection.createChannel();

        // RabbitMQ consumers

        const quickSort_queueName = "quickSortQueueTopic";

        // This function has an exchange, let's use it

        const quickSort_exchange = 'sortExchange';
        await channel.assertExchange(quickSort_exchange, 'topic', {
            durable: false
        });
        const queue_quickSort = await channel.assertQueue(quickSort_queueName, {
            exclusive: true
        });
        await channel.bindQueue(queue_quickSort.queue, quickSort_exchange, 'sort.quick');
        channel.consume(queue_quickSort.queue, async msg => {
            if (msg) {
                console.log("Receiving call");
                const message_call_received = JSON.parse(msg.content.toString());
                const {
                    arr,
                    depth
                } = message_call_received.parameters;
                console.log("Calling function quickSort", arr, depth);
                const result_quickSort = quickSort(arr, depth);
                console.log("Sending response to function quickSort");
                const response_quickSort = {
                    funcName: "quickSort",
                    result: result_quickSort
                };
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_quickSort)), {
                    correlationId: msg.properties.correlationId
                });
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