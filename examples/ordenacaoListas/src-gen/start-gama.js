import express from 'express';
const app = express();
const port = 4444;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import {
    sorteiaNumero
} from "./functions-server2.js";
app.post('/sorteiaLista', async (req, res) => {
    const result = await sorteiaLista();
    return res.json({
        result
    });
});
async function sorteiaLista() {
    const tam = await sorteiaNumero(20, "argumento de teste chegou");
    const lista = [];
    for (let i = 0; i < tam; i++) {
        lista.push(Math.floor(Math.random() * 100) + 1);
    }
    return lista;
}
app.get('/somarNumeros', async (req, res) => {
    const a = req.query.a;
    const b = req.query.b;
    const result = somarNumeros(a, b);
    return res.json({
        result
    });
});

function somarNumeros(a, b) {
    return a + b;
}
app.post('/ehPar', async (req, res) => {
    const numero = req.body.numero;
    const result = ehPar(numero);
    return res.json({
        result
    });
});

function ehPar(numero) {
    return numero % 2 === 0;
}
import {
    multiplicaNumeros
} from "./functions-alfa.js";
app.post('/multiplicaListaPassada', async (req, res) => {
    const lista = req.body.lista;
    const result = await multiplicaListaPassada(lista);
    return res.json({
        result
    });
});
async function multiplicaListaPassada(lista) {
    let mult = 1;
    for (let item of lista) {
        mult = await multiplicaNumeros(mult, item);
    }
    console.log('lista', lista);
    console.log('mult', mult);
    return mult;
}