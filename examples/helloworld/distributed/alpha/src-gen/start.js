import amqp from 'amqplib';
import {
    saveCustomer_localRef as saveCustomer
} from "./database/customer.js";
import {
    saveProduct_localRef as saveProduct
} from "./database/product.js";
async function waitForCalls() {
    const connection = await amqp.connect("myrabbit:5672");
    console.log("Waiting for calls via RabbitMQ");
    const channel = await connection.createChannel();
    const saveCustomer_queueName = "saveCustomer_queue";
    await channel.assertQueue(saveCustomer_queueName, {
        durable: false
    });
    channel.consume(saveCustomer_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "saveCustomer") {
                const {
                    name,
                    address,
                    age,
                    email,
                    number,
                    ssn
                } = message.parameters;

                console.log("Calling function saveCustomer", name, address, age, email, number, ssn);
                const result_saveCustomer = await saveCustomer(name, address, age, email, number, ssn);

                const response_saveCustomer = {
                    funcName: "saveCustomer",
                    result: result_saveCustomer
                };

                console.log("Sending response to function saveCustomer");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_saveCustomer)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
    const saveProduct_queueName = "saveProduct_queue";
    await channel.assertQueue(saveProduct_queueName, {
        durable: false
    });
    channel.consume(saveProduct_queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "saveProduct") {
                const {
                    id,
                    name
                } = message.parameters;

                console.log("Calling function saveProduct", id, name);
                const result_saveProduct = saveProduct(id, name);

                const response_saveProduct = {
                    funcName: "saveProduct",
                    result: result_saveProduct
                };

                console.log("Sending response to function saveProduct");
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_saveProduct)), {
                    correlationId: msg.properties.correlationId
                });
            }
        }
    }, {
        noAck: true
    });
}
waitForCalls();