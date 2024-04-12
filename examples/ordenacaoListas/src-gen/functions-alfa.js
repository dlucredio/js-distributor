import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function testeDeltaMaiorQueZero(delta) {
    let body = {
        delta: delta,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:5555/testeDeltaMaiorQueZero', {
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
export async function multiplicaNumeros(a, b) {
    const response = await fetch('http://localhost:5555/multiplicaNumeros?a=' + a + '&b=' + b);
    const {
        result
    } = await response.json();
    return result;
}
export async function calculaQuadrado(a) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Conectando ao RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Conexão bem-sucedida!");
            console.log("Enviando chamada para a função calculaQuadrado");
            const channel = await connection.createChannel();
            let queueName = "alfa_queue";
            console.log("Declarando fila: alfa_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "calculaQuadrado",
                type: "call",
                parameters: {
                    a: a,
                },
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Recebendo resposta para a função calculaQuadrado");
                    if (message.funcName === "calculaQuadrado" && message.type === "response") {
                        const result = message.result;
                        console.log("Resposta recebida:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Enviando mensagem para a fila: alfa_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Erro ao processar chamada para a função calculaQuadrado:", error);
            reject(error);
        }
    });
    return p;
}