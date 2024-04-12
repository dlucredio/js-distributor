import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function main() {
    const response = await fetch('http://localhost:3000/main');
    const {
        result
    } = await response.json();
    return result;
}
export async function deltaFunction(a, b, c) {
    let body = {
        a: a,
        b: b,
        c: c,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:3000/deltaFunction', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function rodeiSum(a, b) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Conectando ao RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Conexão bem-sucedida!");
            console.log("Enviando chamada para a função rodeiSum");
            const channel = await connection.createChannel();
            let queueName = "server1_queue";
            console.log("Declarando fila: server1_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "rodeiSum",
                type: "call",
                parameters: {
                    a: a,
                    b: b,
                },
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Recebendo resposta para a função rodeiSum");
                    if (message.funcName === "rodeiSum" && message.type === "response") {
                        const result = message.result;
                        console.log("Resposta recebida:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Enviando mensagem para a fila: server1_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Erro ao processar chamada para a função rodeiSum:", error);
            reject(error);
        }
    });
    return p;
}
export async function checkEhPositivo(x) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Conectando ao RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Conexão bem-sucedida!");
            console.log("Enviando chamada para a função checkEhPositivo");
            const channel = await connection.createChannel();
            let queueName = "server1_queue";
            console.log("Declarando fila: server1_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "checkEhPositivo",
                type: "call",
                parameters: {
                    x: x,
                },
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Recebendo resposta para a função checkEhPositivo");
                    if (message.funcName === "checkEhPositivo" && message.type === "response") {
                        const result = message.result;
                        console.log("Resposta recebida:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Enviando mensagem para a fila: server1_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Erro ao processar chamada para a função checkEhPositivo:", error);
            reject(error);
        }
    });
    return p;
}
export async function imprimeTresValores(value1, value2, value3) {
    const response = await fetch('http://localhost:3000/imprimeTresValores?value1=' + value1 + '&value2=' + value2 + '&value3=' + value3);
    const {
        result
    } = await response.json();
    return result;
}