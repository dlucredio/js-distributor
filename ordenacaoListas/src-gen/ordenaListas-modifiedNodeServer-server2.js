import express from 'express';
const app = express();
const port = 5000;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.get('/sorteiaNumero', async (req, res) => {
    console.log("chegou na rota da funcao sorteiaNumero");
    const n = req.query.n;
    const argTeste = req.query.argTeste;
    const result = sorteiaNumero(n, argTeste);
    return res.json({
        result
    });
});

function sorteiaNumero(n, argTeste) {
    console.log(argTeste);
    return Math.floor(Math.random() * n) + 2;
}