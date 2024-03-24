import express from 'express';
const app = express();
const port = 1111;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import {
    rodeiSum
} from "./functions-server1.js";
import {
    sub_rabbit
} from "./functions-server2.js";
async function waitForCallserver3() {
    const connection = await amqp.connect("amqp://localhost");
    console.log("Waiting for calls");
    const channel = await connection.createChannel();
    let queueName = "server3_queue";
    await channel.assertQueue(queueName, {
        durable: false
    });
    channel.consume(queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "main_rabbit" && message.type === "call") {
                const {} = message.parameters;
                console.log("Calling function main_rabbit", );
                const resultmain_rabbit = await main_rabbit();
                const responsemain_rabbit = {
                    funcName: "main_rabbit",
                    type: "response",
                    result: resultmain_rabbit,
                };
                console.log("Sending response to function main_rabbit");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responsemain_rabbit)));
            }
        }
    }, {
        noAck: true
    });
}
waitForCallserver3();
async function main_rabbit() {
    const result = await sub_rabbit(10, 5);
    console.log('Rodei sub aqui');
    console.log("Resultado da função sub:", result);
    const result2 = await rodeiSum(7, 3);
    console.log('Rodei sum');
    console.log("Resultado da função sum:", result2);
    return {
        result,
        result2
    };
}
app.get('/subtraiNumero', async (req, res) => {
    const a = req.query.a;
    const b = req.query.b;
    const result = subtraiNumero(a, b);
    return res.json({
        result
    });
});

function subtraiNumero(a, b) {
    return a - b;
}
import {
    ehPar
} from "./functions-gama.js";
import {
    imprimeTresValores
} from "./functions-server1.js";
import {
    multiplicaNumeros
} from "./functions-alfa.js";
import {
    somarNumeros
} from "./functions-gama.js";
app.post('/doisValores', async (req, res) => {
    const a = req.body.a;
    const b = req.body.b;
    const result = await doisValores(a, b);
    return res.json({
        result
    });
});
async function doisValores(a, b) {
    console.log("valores a, b = ", a, b);
    console.log("a soma eh", await somarNumeros(a, b));
    console.log("a mult eh", await multiplicaNumeros(a, b));
    let teste = async function() {
        console.log('a, b, a eh par?');
        await imprimeTresValores(a, b, await ehPar(a));
    }
    let teste2 = function() {
        console.log("apenas um teste de funcao anonima");
    }
    teste();
    console.log("a eh par?", await ehPar(a));
    console.log("b eh par?", await ehPar(b));
}
import {
    sorteiaLista
} from "./functions-gama.js";
app.get('/multiplicaLista', async (req, res) => {
    const a = req.query.a;
    const b = req.query.b;
    const result = await multiplicaLista(a, b);
    return res.json({
        result
    });
});
async function multiplicaLista(a, b) {
    const lista = await sorteiaLista();
    let mult = 1;
    for (let item of lista) {
        mult = await multiplicaNumeros(mult, item);
    }
    lista.forEach((item) => {
        console.log("apenas um teste de forEach");
    });
    console.log('lista', lista);
    console.log('mult', mult);
    return mult;
}