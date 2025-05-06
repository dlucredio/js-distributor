import config from "../config/Configuration.js";

function importStatements() {
    return [
        "import { v4 as uuidv4_js_dist } from 'uuid';",
        "import amqp from 'amqplib';"
    ];
}

function generateWaitForCalls(f) {
    const hasExchange = !!f.functionInfo.rabbitConfig.exchangeName;
    return `
        ${hasExchange ? `
            // This function has an exchange, let's use it

            const ${f.functionName}_exchange = '${f.functionInfo.rabbitConfig.exchangeName}';
            await channel.assertExchange(${f.functionName}_exchange, '${f.rabbitConfig.exchangeType}', { durable: false });
            const queue_${f.functionName} = await channel.assertQueue('', { exclusive: true });
            await channel.bindQueue(queue_${f.functionName}.queue, ${f.functionName}_exchange, '${f.functionInfo.rabbitConfig.routingKey}');
            channel.consume(
                queue_${f.functionName}.queue,
                async (msg) => {
                    if (msg) {
                        console.log("Receiving call");
                        const message = JSON.parse(msg.content.toString());

        ` : `
            // This function does not have an exchange, let's use the queue directly

            const ${f.functionName}_queueName = "${f.functionInfo.rabbitConfig.queue ? f.functionInfo.rabbitConfig.queue : f.functionName+"_queue"}";
            await channel.assertQueue(${f.functionName}_queueName, { durable: false });
            channel.consume(
                ${f.functionName}_queueName,
                async (msg) => {
                    if (msg) {
                        console.log("Receiving call");
                        const message_call_received = JSON.parse(msg.content.toString());
                        if (message_call_received.funcName === "${f.functionName}") {
        `}
        const { ${f.args.join(", ")} } = message_call_received.parameters;
        console.log("Calling function ${f.functionName}", ${f.args});
        const result_${f.functionName} = ${f.isAsync ? "await " : ""} ${f.functionName}(${f.args.join(", ")});
        const response_${f.functionName} = {
            funcName: "${f.functionName}",
            result: result_${f.functionName}
        };
        console.log("Sending response to function ${f.functionName}");

        ${hasExchange ? `
            ${f.functionInfo.rabbitConfig.callbackQueue === 'anonymous' ? `
                channel.publish('', msg.properties.replyTo, Buffer.from(JSON.stringify(response_${f.functionName})), {
            ` : `
                channel.publish(${f.functionName}_exchange, '${f.functionInfo.rabbitConfig.callbackQueue}', Buffer.from(JSON.stringify(response_${f.functionName})), {
            `}
                        correlationId: msg.properties.correlationId
                    });
                }            
            }, { noAck: true });    
        ` : `
            ${f.functionInfo.rabbitConfig.callbackQueue === 'anonymous' ? `
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response_${f.functionName})), {
            ` : `
                channel.sendToQueue('${f.functionInfo.rabbitConfig.callbackQueue}', Buffer.from(JSON.stringify(response_${f.functionName})), {
            `}
                            correlationId: msg.properties.correlationId
                        });
                    }
                }
            }, { noAck: true });
        `}

    `;
}

function rabbitProducerCode(functionName, functionInfo, args) {
    const hasExchange = !!functionInfo.rabbitConfig.exchangeName;
    const responseQueue = 'q.queue';
    if(!hasExchange && functionInfo.rabbitConfig.callbackQueue !== 'anonymous') {
        responseQueue = 'callbackQueue';
    }

    return `
{
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Connecting to RabbitMQ...");
            const connection = await amqp.connect("amqp://${config.getRabbitConfig().url}:${config.getRabbitConfig().port}");
            console.log("Connection established!");
            console.log("Sending call to function ${functionName}");
            const channel = await connection.createChannel();
            const q = await channel.assertQueue('', {
                exclusive: true,
            });
            ${hasExchange ? `
                const ${functionName}_exchange = '${functionInfo.rabbitConfig.exchangeName}';
                await channel.assertExchange(${functionName}_exchange, '${functionInfo.rabbitConfig.exchangeType}', {
                    durable: false,
                });
                ${functionInfo.rabbitConfig.callbackQueue !== 'anonymous' ? `
                    await channel.bindQueue(q.queue, ${functionName}_exchange, '${functionInfo.rabbitConfig.callbackQueue}');
                ` : ``}
            ` : `
                const queueName = "${functionInfo.rabbitConfig.queue ? functionInfo.rabbitConfig.queue : functionName+"_queue"}";

                console.log("Declaring queue: " + queueName);
                ${functionInfo.rabbitConfig.callbackQueue !== 'anonymous' ? `
                    const callbackQueue = "${functionInfo.rabbitConfig.callbackQueue}";
                    await channel.assertQueue(callbackQueue, { durable: false });
                ` : ``}
            `}
            const correlationId = uuidv4_js_dist();
            const callObj = {
                funcName: "${functionName}",
                parameters: {
                    ${args.map(a => a + " : " + a).join(", ")}
                },
            };
            channel.consume(
                ${responseQueue},
                (msg) => {
                    if (msg) {
                        const message = JSON.parse(msg.content.toString());
                        console.log("Receiving response for function ${functionName}");
                        if (msg.properties.correlationId === correlationId) {
                            const result = message.result;
                            console.log("Response received:", result);
                            resolve(result);
                            channel.cancel(msg.fields.consumerTag);
                        }
                    }
                },
                {
                    noAck: true,
                }
            );
            ${hasExchange ? `
                channel.publish(${functionName}_exchange, '${functionInfo.rabbitConfig.routingKey}', Buffer.from(JSON.stringify(callObj))
            ` : `
                console.log("Sending message to queue: ${functionInfo.rabbitConfig.queue ? functionInfo.rabbitConfig.queue : functionName+"_queue"}");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj))
            `}
            , {
                correlationId: correlationId
                ${functionInfo.rabbitConfig.callbackQueue === 'anonymous' ? `, replyTo: q.queue` : ``}
            });
        } catch (error) {
            console.error("Error processing call to function ${functionName}:", error);
            reject(error);
        }
    });
    return p;
}
    `;
}


export default {
    importStatements, generateWaitForCalls, rabbitProducerCode
}