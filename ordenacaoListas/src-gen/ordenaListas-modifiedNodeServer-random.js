/*---servidor random---*/
const express = require('express');
const app = express();
const port = 5000;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.get('/sorteiaNumero', async (req, res) => {
    const result = sorteiaNumero();
    return res.json({
        result
    });
});

function sorteiaNumero() {
    return Math.floor(Math.random() * 20) + 2;
}
app.get('/sorteiaLista', async (req, res) => {
    const result = sorteiaLista();
    return res.json({
        result
    });
});

function sorteiaLista() {
    const lista = [];
    const tam = sorteiaNumero();
    for (let i = 0; i < tam; i++) {
        lista.push(Math.floor(Math.random() * 100) + 1);
    }
    return lista;
}