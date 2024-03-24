import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import {
    sub_rabbit
} from "./functions-server2.js";
import {
    ordenaListas
} from "./functions-server2.js";
import {
    sorteiaLista
} from "./functions-gama.js";
app.get('/main', async (req, res) => {
    const result = await main();
    return res.json({
        result
    });
});
async function main() {
    console.log("");
    const lista = await sorteiaLista();
    const listaOrdenada = await ordenaListas(lista, 'selectionSort', 'selection sort');
    console.log("lista ordenada: ", listaOrdenada);
    console.log("diferenca entre ultimo e primeiro elemento", await sub_rabbit(listaOrdenada[(listaOrdenada.length - 1)], listaOrdenada[0]));
    return listaOrdenada;
}
import {
    testeDeltaMaiorQueZero
} from "./functions-alfa.js";
app.post('/deltaFunction', async (req, res) => {
    const a = req.body.a;
    const b = req.body.b;
    const c = req.body.c;
    const result = await deltaFunction(a, b, c);
    return res.json({
        result
    });
});
async function deltaFunction(a, b, c) {
    console.log("delta maior que zero?", await testeDeltaMaiorQueZero(b * b - 4 * a * c));
    return b * b - 4 * a * c;
}
import {
    sum_rabbit
} from "./functions-server2.js";
async function waitForCallserver1() {
    const connection = await amqp.connect("amqp://localhost");
    console.log("Waiting for calls");
    const channel = await connection.createChannel();
    let queueName = "server1_queue";
    await channel.assertQueue(queueName, {
        durable: false
    });
    channel.consume(queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "rodeiSum" && message.type === "call") {
                const {
                    a,
                    b
                } = message.parameters;
                console.log("Calling function rodeiSum", a, b);
                const resultrodeiSum = await rodeiSum(a, b);
                const responserodeiSum = {
                    funcName: "rodeiSum",
                    type: "response",
                    result: resultrodeiSum,
                };
                console.log("Sending response to function rodeiSum");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responserodeiSum)));
            }
            if (message.funcName === "checkEhPositivo" && message.type === "call") {
                const {
                    x
                } = message.parameters;
                console.log("Calling function checkEhPositivo", x);
                const resultcheckEhPositivo = await checkEhPositivo(x);
                const responsecheckEhPositivo = {
                    funcName: "checkEhPositivo",
                    type: "response",
                    result: resultcheckEhPositivo,
                };
                console.log("Sending response to function checkEhPositivo");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responsecheckEhPositivo)));
            }
        }
    }, {
        noAck: true
    });
}
waitForCallserver1();
async function rodeiSum(a, b) {
    return await sum_rabbit(a, b);
}
async function checkEhPositivo(x) {
    const retorno = await sub_rabbit(0, x);
    if (retorno < 0)
        return `${x} eh positivo`;
    else return `${x} eh negativo`;
}
app.get('/imprimeTresValores', async (req, res) => {
    const value1 = req.query.value1;
    const value2 = req.query.value2;
    const value3 = req.query.value3;
    const result = imprimeTresValores(value1, value2, value3);
    return res.json({
        result
    });
});

function imprimeTresValores(value1, value2, value3) {
    let teste = function(valor) {
        console.log(valor);
    }
    teste(value1);
    teste(value2);
    teste(value3);
}