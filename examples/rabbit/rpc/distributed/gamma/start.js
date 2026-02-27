import amqp from 'amqplib';
import {
    sortArray_localRef as sortArray
} from "./app.js";
async function waitForCalls() {
    try {
        const rabbitConnectionURL = "amqp://localhost:5672";
        const connection = await tryToConnectToRabbit(rabbitConnectionURL, 5, 10);
        console.log("Waiting for calls via RabbitMQ on port 5672");
        const channel = await connection.createChannel();

        // RabbitMQ consumers

        // This function does not have an exchange, let's use the queue directly

        const sortArray_queueName = "sortArrayRPCQueue";
        await channel.assertQueue(sortArray_queueName, {
            durable: false
        });
        channel.consume(sortArray_queueName, async msg => {
            if (msg) {
                console.log("Receiving call");
                const message_call_received = JSON.parse(msg.content.toString());
                if (message_call_received.funcName === "sortArray") {
                    const {
                        array,
                        algorithm
                    } = message_call_received.parameters;
                    console.log("Calling function sortArray", array, algorithm);
                    const result_sortArray = sortArray(array, algorithm);
                    const response_sortArray = {
                        funcName: "sortArray",
                        result: result_sortArray
                    };
                    console.log("Sending response to function sortArray");
                    channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_sortArray)), {
                        correlationId: msg.properties.correlationId
                    });
                }
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