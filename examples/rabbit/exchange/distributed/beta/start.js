import amqp from 'amqplib';
import {
    mergeSort_localRef as mergeSort
} from "./app.js";
async function waitForCalls() {
    try {
        const rabbitConnectionURL = "amqp://localhost:5672";
        const connection = await tryToConnectToRabbit(rabbitConnectionURL, 5, 10);
        console.log("Waiting for calls via RabbitMQ on port 5672");
        const channel = await connection.createChannel();

        // RabbitMQ consumers

        const mergeSort_queueName = "mergeSortQueueDirect";

        // This function has an exchange, let's use it

        const mergeSort_exchange = 'sortExchange';
        await channel.assertExchange(mergeSort_exchange, 'fanout', {
            durable: false
        });
        const queue_mergeSort = await channel.assertQueue(mergeSort_queueName, {
            exclusive: true
        });
        await channel.bindQueue(queue_mergeSort.queue, mergeSort_exchange, '');
        channel.consume(queue_mergeSort.queue, async msg => {
            if (msg) {
                console.log("Receiving call");
                const message_call_received = JSON.parse(msg.content.toString());
                const {
                    arr,
                    depth
                } = message_call_received.parameters;
                console.log("Calling function mergeSort", arr, depth);
                const result_mergeSort = mergeSort(arr, depth);
                console.log("Sending response to function mergeSort");
                const response_mergeSort = {
                    funcName: "mergeSort",
                    result: result_mergeSort
                };
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_mergeSort)), {
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