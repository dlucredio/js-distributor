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

            const ${f.functionName}_queueName = "${f.functionInfo.rabbitConfig.queue}";
            await channel.assertQueue(${f.functionName}_queueName, { durable: false });
            channel.consume(
                ${f.functionName}_queueName,
                async (msg) => {
                    if (msg) {
                        console.log("Receiving call");
                        const message = JSON.parse(msg.content.toString());
                        if (message.funcName === "${f.functionName}") {
        `}
        const { ${f.args.join(", ")} } = message.parameters;
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

export default {
    generateWaitForCalls
}