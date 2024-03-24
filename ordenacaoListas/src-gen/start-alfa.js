import express from 'express';
const app = express();
const port = 5555;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
app.post('/testeDeltaMaiorQueZero', async (req, res) => {
    const delta = req.body.delta;
    const result = testeDeltaMaiorQueZero(delta);
    return res.json({
        result
    });
});

function testeDeltaMaiorQueZero(delta) {
    return (delta > 0);
}
app.get('/multiplicaNumeros', async (req, res) => {
    const a = req.query.a;
    const b = req.query.b;
    const result = multiplicaNumeros(a, b);
    return res.json({
        result
    });
});

function multiplicaNumeros(a, b) {
    return a * b;
}
async function waitForCallalfa() {
    const connection = await amqp.connect("amqp://localhost");
    console.log("Waiting for calls");
    const channel = await connection.createChannel();
    let queueName = "alfa_queue";
    await channel.assertQueue(queueName, {
        durable: false
    });
    channel.consume(queueName, async (msg) => {
        if (msg) {
            console.log("Receiving call");
            const message = JSON.parse(msg.content.toString());
            if (message.funcName === "calculaQuadrado" && message.type === "call") {
                const {
                    a
                } = message.parameters;
                console.log("Calling function calculaQuadrado", a);
                const resultcalculaQuadrado = await calculaQuadrado(a);
                const responsecalculaQuadrado = {
                    funcName: "calculaQuadrado",
                    type: "response",
                    result: resultcalculaQuadrado,
                };
                console.log("Sending response to function calculaQuadrado");
                channel.sendToQueue(queueName, Buffer.from(JSON.stringify(responsecalculaQuadrado)));
            }
        }
    }, {
        noAck: true
    });
}
waitForCallalfa();

function calculaQuadrado(a) {
    return multiplicaNumeros(a, a);
}