import express from 'express';
const app = express();
const port = 3333;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import {
    deTeste
} from "./functions-server4.js";
app.post('/imprimeLista', async (req, res) => {
    const msg = req.body.msg;
    const lista = req.body.lista;
    const result = await imprimeLista(msg, lista);
    return res.json({
        result
    });
});
async function imprimeLista(msg, lista) {
    console.log(msg, lista);
    console.log("funcao de teste retornou: ", await deTeste("true"));
}
import {
    subtraiNumero
} from "./functions-server3.js";
import {
    deltaFunction
} from "./functions-server1.js";
import {
    imprimeTresValores
} from "./functions-server1.js";
app.get('/calcularBhaskara', async (req, res) => {
    const a = req.query.a;
    const b = req.query.b;
    const c = req.query.c;
    const result = await calcularBhaskara(a, b, c);
    return res.json({
        result
    });
});
async function calcularBhaskara(a, b, c) {
    console.log("coeficientes: ");
    await imprimeTresValores(a, b, c);
    const delta = await deltaFunction(a, b, c) / 1;
    if (delta < 0) {
        return "A equação não possui raízes reais.";

    }
    const x1 = await subtraiNumero(Math.sqrt(delta), b) / (2 * a);
    const x2 = await subtraiNumero(-Math.sqrt(delta), b) / (2 * a);
    return {
        x1,
        x2
    };
}
import {
    multiplicaLista
} from "./functions-server3.js";
app.post('/randomZeroUm', async (req, res) => {
    const result = await randomZeroUm();
    return res.json({
        result
    });
});
async function randomZeroUm() {
    const listaZeroMult = await multiplicaLista();
    const listaUmMult = await multiplicaLista();
    if (listaZeroMult > listaUmMult) {
        console.log('sorteio zero com multiplicacao', listaZeroMult);
        return 0;

    } else {
        console.log('sorteio um ganhou com multiplicacao', listaUmMult);
        return 1;

    }
}