import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function main_rabbit() {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Conectando ao RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Conexão bem-sucedida!");
            console.log("Enviando chamada para a função main_rabbit");
            const channel = await connection.createChannel();
            let queueName = "server3_queue";
            console.log("Declarando fila: server3_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "main_rabbit",
                type: "call",
                parameters: {},
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Recebendo resposta para a função main_rabbit");
                    if (message.funcName === "main_rabbit" && message.type === "response") {
                        const result = message.result;
                        console.log("Resposta recebida:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Enviando mensagem para a fila: server3_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Erro ao processar chamada para a função main_rabbit:", error);
            reject(error);
        }
    });
    return p;
}
export async function subtraiNumero(a, b) {
    const response = await fetch('http://localhost:1111/subtraiNumero?a=' + a + '&b=' + b);
    const {
        result
    } = await response.json();
    return result;
}
export async function doisValores(a, b) {
    let body = {
        a: a,
        b: b,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:1111/doisValores', {
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
export async function multiplicaLista() {
    const response = await fetch('http://localhost:1111/multiplicaLista?a=' + undefined + '&b=' + undefined);
    const {
        result
    } = await response.json();
    return result;
}