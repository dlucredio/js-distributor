import express from 'express';
const app = express();
const port = 5000;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import {
    imprimeLista
} from "./functions-server5.js";
import {
    selectionSort
} from "./functions-server4.js";
app.post('/ordenaListas', async (req, res) => {
    const lista = req.body.lista;
    const metodo = req.body.metodo;
    const msg = req.body.msg;
    const result = await ordenaListas(lista, metodo, msg);
    return res.json({
        result
    });
});
async function ordenaListas(lista, metodo, msg) {
    console.log('ordenacao feita pelo metodo ', msg);
    if (metodo == 'selectionSort')
        return await selectionSort(lista);
    else(metodo == 'insertionSort');
    return insertionSort(lista);
}
app.get('/sorteiaNumero', async (req, res) => {
    const x = req.query.x;
    const argTeste = req.query.argTeste;
    const result = sorteiaNumero(x, argTeste);
    return res.json({
        result
    });
});

function sorteiaNumero(x, argTeste) {
    console.log('argumentos', x, argTeste);
    return Math.floor(Math.random() * x) + 2;
}
app.post('/insertionSort', async (req, res) => {
    const inputArr = req.body.inputArr;
    const result = await insertionSort(inputArr);
    return res.json({
        result
    });
});
async function insertionSort(inputArr) {
    let n = inputArr.length;
    for (let i = 1; i < n; i++) {
        let current = inputArr[i];

        let j = i - 1;

        while ((j > -1) && (current < inputArr[j])) {
            inputArr[j + 1] = inputArr[j];
            j--;
        }
        inputArr[j + 1] = current;
    }
    await imprimeLista("resultado da lista ordenada:", inputArr);
    return inputArr;
}
async function waitForCallserver2() {
    const connection = await amqp.connect("amqp://localhost");
    console.log("Waiting for calls");
    const channel = await connection.createChannel();
    let queueName = "server2_queue";
    await channel.assertQueue(queueName, {
        durable: false
    });
    channel.consume(queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "sub_rabbit" && message.type === "call") {
                const {
                    a,
                    b
                } = message.parameters;
                console.log("Calling function sub_rabbit", a, b);
                const resultsub_rabbit = await sub_rabbit(a, b);
                const responsesub_rabbit = {
                    funcName: "sub_rabbit",
                    type: "response",
                    result: resultsub_rabbit,
                };
                console.log("Sending response to function sub_rabbit");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responsesub_rabbit)));
            }
            if (message.funcName === "sum_rabbit" && message.type === "call") {
                const {
                    a,
                    b
                } = message.parameters;
                console.log("Calling function sum_rabbit", a, b);
                const resultsum_rabbit = await sum_rabbit(a, b);
                const responsesum_rabbit = {
                    funcName: "sum_rabbit",
                    type: "response",
                    result: resultsum_rabbit,
                };
                console.log("Sending response to function sum_rabbit");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responsesum_rabbit)));
            }
        }
    }, {
        noAck: true
    });
}
waitForCallserver2();

function sub_rabbit(a, b) {
    return a - b;
}

function sum_rabbit(a, b) {
    return a + b;
}
import {
    imprimeTresValores
} from "./functions-server1.js";
import {
    multiplicaListaPassada
} from "./functions-gama.js";
import {
    sorteiaLista
} from "./functions-gama.js";
app.post('/fazTudoComLista', async (req, res) => {
    const result = await fazTudoComLista();
    return res.json({
        result
    });
});
async function fazTudoComLista() {
    const lista = await sorteiaLista();
    const multiplicacao = await multiplicaListaPassada(lista);
    const listaOrdenada = insertionSort(lista);
    await imprimeTresValores(lista, listaOrdenada, multiplicacao);
}
app.post('/inverterString', async (req, res) => {
    const str = req.body.str;
    const result = inverterString(str);
    return res.json({
        result
    });
});

function inverterString(str) {
    return str.split('').reverse().join('');
}