import fetch from 'node-fetch';
import amqp from 'amqplib';
export async function ordenaListas(lista, metodo, msg) {
    let body = {
        lista: lista,
        metodo: metodo,
        msg: msg,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:5000/ordenaListas', {
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
export async function sorteiaNumero(x, argTeste) {
    const response = await fetch('http://localhost:5000/sorteiaNumero?x=' + x + '&argTeste=' + argTeste);
    const {
        result
    } = await response.json();
    return result;
}
export async function insertionSort(inputArr) {
    let body = {
        inputArr: inputArr,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:5000/insertionSort', {
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
export async function sub_rabbit(a, b) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Conectando ao RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Conexão bem-sucedida!");
            console.log("Enviando chamada para a função sub_rabbit");
            const channel = await connection.createChannel();
            let queueName = "server2_queue";
            console.log("Declarando fila: server2_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "sub_rabbit",
                type: "call",
                parameters: {
                    a: a,
                    b: b,
                },
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Recebendo resposta para a função sub_rabbit");
                    if (message.funcName === "sub_rabbit" && message.type === "response") {
                        const result = message.result;
                        console.log("Resposta recebida:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Enviando mensagem para a fila: server2_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Erro ao processar chamada para a função sub_rabbit:", error);
            reject(error);
        }
    });
    return p;
}
export async function sum_rabbit(a, b) {
    const p = new Promise(async (resolve, reject) => {
        try {
            console.log("Conectando ao RabbitMQ...");
            const connection = await amqp.connect("amqp://localhost");
            console.log("Conexão bem-sucedida!");
            console.log("Enviando chamada para a função sum_rabbit");
            const channel = await connection.createChannel();
            let queueName = "server2_queue";
            console.log("Declarando fila: server2_queue");
            await channel.assertQueue(queueName, {
                durable: false,
            });
            const callObj = {
                funcName: "sum_rabbit",
                type: "call",
                parameters: {
                    a: a,
                    b: b,
                },
            };
            channel.consume(queueName, (msg) => {
                if (msg) {
                    const message = JSON.parse(msg.content.toString());
                    console.log("Recebendo resposta para a função sum_rabbit");
                    if (message.funcName === "sum_rabbit" && message.type === "response") {
                        const result = message.result;
                        console.log("Resposta recebida:", result);
                        resolve(result);
                        channel.cancel(msg.fields.consumerTag);
                    }
                }
            }, {
                noAck: true,
            });
            console.log("Enviando mensagem para a fila: server2_queue");
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(callObj)));
        } catch (error) {
            console.error("Erro ao processar chamada para a função sum_rabbit:", error);
            reject(error);
        }
    });
    return p;
}
export async function fazTudoComLista() {
    const response = await fetch('http://localhost:5000/fazTudoComLista', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function inverterString(str) {
    let body = {
        str: str,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:5000/inverterString', {
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