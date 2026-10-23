import config from "../config/Configuration.js";

// ── Shared helpers ────────────────────────────────────────────────────────────

function importStatements() {
    return [
        "import { v4 as uuidv4_js_dist } from 'uuid';",
        "import amqp from 'amqplib';"
    ];
}

// ── Consumer side (server / theta) ────────────────────────────────────────────
// Unchanged from original — the consumer already reads msg.properties.replyTo
// when callbackQueue === 'anonymous', so both options work on this side.

function generateWaitForCalls(f) {
    const hasExchange = !!f.functionInfo.rabbitConfig.exchangeName;
    return `
        const ${f.functionName}_queueName = "${f.functionInfo.rabbitConfig.queue ? f.functionInfo.rabbitConfig.queue : f.functionName+"_queue"}";

        ${hasExchange ? `
            // This function has an exchange, let's use it

            const ${f.functionName}_exchange = '${f.functionInfo.rabbitConfig.exchangeName}';
            await channel.assertExchange(${f.functionName}_exchange, '${f.functionInfo.rabbitConfig.exchangeType}', { durable: false });
            const queue_${f.functionName} = await channel.assertQueue(${f.functionName}_queueName, { exclusive: true });
            await channel.bindQueue(queue_${f.functionName}.queue, ${f.functionName}_exchange, '${f.functionInfo.rabbitConfig.routingKey}');
            channel.consume(
                queue_${f.functionName}.queue,
                async (msg) => {
                    if (msg) {
                        console.log("Receiving call");
                        const message_call_received = JSON.parse(msg.content.toString());

        ` : `
            // This function does not have an exchange, let's use the queue directly

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

        ${!f.functionInfo.rabbitConfig.hasReturn ? `` : `

            console.log("Sending response to function ${f.functionName}");

            const response_${f.functionName} = {
                funcName: "${f.functionName}",
                result: result_${f.functionName}
            };

            channel.sendToQueue(
                ${f.functionInfo.rabbitConfig.callbackQueue === 'anonymous' ? `msg.properties.replyTo` : `'${f.functionInfo.rabbitConfig.callbackQueue}'`}
                , Buffer.from(JSON.stringify(response_${f.functionName})), {
                    correlationId: msg.properties.correlationId
                });
        `}
        ${hasExchange ? `` : `}`}
            }
        }, { noAck: true });

    `;
}

// ── Option 2 — single instance ────────────────────────────────────────────────
//
// One persistent connection + channel + pending Map shared across all calls.
// Reply queue is a fixed named queue (e.g. 'cargoDataCallBack').
//
// Works correctly under concurrent load because each call is keyed by a unique
// correlationId in the Map — no per-call consumer or queue is created.
//
// Limitation: if multiple instances of this server run simultaneously they all
// consume from the same reply queue, so a reply can land on the wrong instance
// (its Map won't have the correlationId → message is dropped).
// Use the multi-instance option when horizontal scaling is needed.

/**
 * Emitted once at the top of the caller module.
 * @param {Array} functions - all rabbit-producer functions with hasReturn:true
 */
function generateRabbitClientBootstrap_singleInstance(functions) {
    const returningFns = functions.filter(f => f.functionInfo.rabbitConfig?.hasReturn);
    if (returningFns.length === 0) return '';

    // deduplicate named reply queues
    const namedQueues = [...new Set(
        returningFns
            .filter(f => f.functionInfo.rabbitConfig.callbackQueue !== 'anonymous')
            .map(f => f.functionInfo.rabbitConfig.callbackQueue)
    )];

    const namedQueueSetup = namedQueues.map(q => `
    await _rabbit_channel.assertQueue('${q}', { durable: false });
    _rabbit_channel.consume('${q}', _rabbit_reply_handler, { noAck: true });`).join('\n');

    return `
// ── Shared RabbitMQ client state (single-instance) ───────────────────────────
const _rabbit_pending = new Map();
let _rabbit_channel;

function _rabbit_reply_handler(msg) {
    if (!msg) return;
    const resolver = _rabbit_pending.get(msg.properties.correlationId);
    if (resolver) {
        _rabbit_pending.delete(msg.properties.correlationId);
        resolver(JSON.parse(msg.content.toString()).result);
    }
}

const _rabbit_ready = (async () => {
    const _rabbit_conn = await amqp.connect("amqp://${config.getRabbitConfig().url}:${config.getRabbitConfig().port}");
    _rabbit_channel = await _rabbit_conn.createChannel();
    ${namedQueueSetup}
    return _rabbit_channel;
})();
// ─────────────────────────────────────────────────────────────────────────────
`;
}

/**
 * Thin per-function call code (single-instance variant).
 * Uses the shared channel and pending map from the bootstrap above.
 */
function rabbitProducerCode_singleInstance(functionName, functionInfo, args) {
    if (!functionInfo.rabbitConfig.hasReturn) {
        return _fireAndForgetCode(functionName, functionInfo, args);
    }

    const hasExchange = !!functionInfo.rabbitConfig.exchangeName;
    const replyTo     = `'${functionInfo.rabbitConfig.callbackQueue}'`;

    return `
{
    const channel = await _rabbit_ready;
    return new Promise((resolve, reject) => {
        let correlationId;
        try {
            correlationId = uuidv4_js_dist();
            _rabbit_pending.set(correlationId, resolve);
            const callObj = {
                funcName: "${functionName}",
                parameters: { ${args.map(a => a + ': ' + a).join(', ')} },
            };
            ${hasExchange ? `
            channel.publish('${functionInfo.rabbitConfig.exchangeName}', '${functionInfo.rabbitConfig.routingKey}',
                Buffer.from(JSON.stringify(callObj)), { correlationId, replyTo: ${replyTo} });
            ` : `
            channel.sendToQueue('${functionInfo.rabbitConfig.queue || functionName + '_queue'}',
                Buffer.from(JSON.stringify(callObj)), { correlationId, replyTo: ${replyTo} });
            `}
        } catch (error) {
            if (correlationId) _rabbit_pending.delete(correlationId);
            reject(error);
        }
    });
}
`;
}

// ── Option 2 — multi-instance ─────────────────────────────────────────────────
//
// Same as single-instance but the reply queue name includes a UUID generated
// once at server startup. Each running instance gets its own exclusive queue,
// so replies are always routed to the correct instance and its local Map is
// always valid — no message loss under horizontal scaling.
//
// The queue is declared with autoDelete:true so RabbitMQ cleans it up
// automatically when the server process dies.
//
// On the consumer side (theta / generateWaitForCalls) nothing changes:
// it already uses msg.properties.replyTo when callbackQueue === 'anonymous'.

/**
 * Emitted once at the top of the caller module.
 * @param {Array} functions - all rabbit-producer functions with hasReturn:true
 */
function generateRabbitClientBootstrap_multiInstance(functions) {
    const returningFns = functions.filter(f => f.functionInfo.rabbitConfig?.hasReturn);
    if (returningFns.length === 0) return '';

    const hasAnonymous = returningFns.some(
        f => f.functionInfo.rabbitConfig.callbackQueue === 'anonymous'
    );
    const namedQueues = [...new Set(
        returningFns
            .filter(f => f.functionInfo.rabbitConfig.callbackQueue !== 'anonymous')
            .map(f => f.functionInfo.rabbitConfig.callbackQueue)
    )];

    const namedQueueSetup = namedQueues.map(q => `
    await _rabbit_channel.assertQueue('${q}', { durable: false });
    _rabbit_channel.consume('${q}', _rabbit_reply_handler, { noAck: true });`).join('\n');

    // One instance-scoped queue for ALL anonymous-callback functions.
    // They share the pending Map keyed by correlationId, so there is no conflict.
    const anonymousQueueSetup = hasAnonymous ? `
    const _rabbit_instance_reply_queue = \`reply-\${uuidv4_js_dist()}\`;
    await _rabbit_channel.assertQueue(_rabbit_instance_reply_queue, { durable: false, autoDelete: true });
    _rabbit_channel.consume(_rabbit_instance_reply_queue, _rabbit_reply_handler, { noAck: true });` : '';

    const returnValue = hasAnonymous
        ? `return { channel: _rabbit_channel, instanceReplyQueue: _rabbit_instance_reply_queue };`
        : `return { channel: _rabbit_channel };`;

    return `
// ── Shared RabbitMQ client state (multi-instance) ────────────────────────────
const _rabbit_pending = new Map();
let _rabbit_channel;

function _rabbit_reply_handler(msg) {
    if (!msg) return;
    const resolver = _rabbit_pending.get(msg.properties.correlationId);
    if (resolver) {
        _rabbit_pending.delete(msg.properties.correlationId);
        resolver(JSON.parse(msg.content.toString()).result);
    }
}

const _rabbit_ready = (async () => {
    const _rabbit_conn = await amqp.connect("amqp://${config.getRabbitConfig().url}:${config.getRabbitConfig().port}");
    _rabbit_channel = await _rabbit_conn.createChannel();
    ${namedQueueSetup}
    ${anonymousQueueSetup}
    ${returnValue}
})();
// ─────────────────────────────────────────────────────────────────────────────
`;
}

/**
 * Thin per-function call code (multi-instance variant).
 * Uses the shared channel and pending map from the bootstrap above.
 * For anonymous callbackQueues, destructures instanceReplyQueue from _rabbit_ready.
 */
function rabbitProducerCode_multiInstance(functionName, functionInfo, args) {
    if (!functionInfo.rabbitConfig.hasReturn) {
        return _fireAndForgetCode(functionName, functionInfo, args);
    }

    const hasExchange = !!functionInfo.rabbitConfig.exchangeName;
    const isAnonymous = functionInfo.rabbitConfig.callbackQueue === 'anonymous';
    const destructure  = isAnonymous ? '{ channel, instanceReplyQueue }' : '{ channel }';
    const replyTo      = isAnonymous ? 'instanceReplyQueue' : `'${functionInfo.rabbitConfig.callbackQueue}'`;

    return `
{
    const ${destructure} = await _rabbit_ready;
    return new Promise((resolve, reject) => {
        let correlationId;
        try {
            correlationId = uuidv4_js_dist();
            _rabbit_pending.set(correlationId, resolve);
            const callObj = {
                funcName: "${functionName}",
                parameters: { ${args.map(a => a + ': ' + a).join(', ')} },
            };
            ${hasExchange ? `
            channel.publish('${functionInfo.rabbitConfig.exchangeName}', '${functionInfo.rabbitConfig.routingKey}',
                Buffer.from(JSON.stringify(callObj)), { correlationId, replyTo: ${replyTo} });
            ` : `
            channel.sendToQueue('${functionInfo.rabbitConfig.queue || functionName + '_queue'}',
                Buffer.from(JSON.stringify(callObj)), { correlationId, replyTo: ${replyTo} });
            `}
        } catch (error) {
            if (correlationId) _rabbit_pending.delete(correlationId);
            reject(error);
        }
    });
}
`;
}

// ── Shared fire-and-forget (no reply) ─────────────────────────────────────────
// Same for both options — no pending map entry, no replyTo.

function _fireAndForgetCode(functionName, functionInfo, args) {
    const hasExchange = !!functionInfo.rabbitConfig.exchangeName;
    return `
{
    const { channel } = await _rabbit_ready;
    const callObj = {
        funcName: "${functionName}",
        parameters: { ${args.map(a => a + ': ' + a).join(', ')} },
    };
    ${hasExchange ? `
    channel.publish('${functionInfo.rabbitConfig.exchangeName}', '${functionInfo.rabbitConfig.routingKey}',
        Buffer.from(JSON.stringify(callObj)));
    ` : `
    channel.sendToQueue('${functionInfo.rabbitConfig.queue || functionName + '_queue'}',
        Buffer.from(JSON.stringify(callObj)));
    `}
}
`;
}

// ── Legacy export (original single-call-per-connection behaviour) ─────────────
// Kept for reference. DO NOT use in new code — replaced by the options above.

function rabbitProducerCode(functionName, functionInfo, args) {
    const hasExchange = !!functionInfo.rabbitConfig.exchangeName;
    let responseQueue = 'q.queue';
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
            ${functionInfo.rabbitConfig.callbackQueue === 'anonymous' ? `
                const q = await channel.assertQueue('', {
                    exclusive: true,
                });
            ` : ``}
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
    importStatements,
    generateWaitForCalls,
    // option 2 — single instance
    generateRabbitClientBootstrap_singleInstance,
    rabbitProducerCode_singleInstance,
    // option 2 — multi instance
    generateRabbitClientBootstrap_multiInstance,
    rabbitProducerCode_multiInstance,
    // legacy (original)
    rabbitProducerCode,
}