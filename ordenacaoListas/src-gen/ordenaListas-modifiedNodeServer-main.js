/*---servidor main---*/
const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.get('/main', async (req, res) => {
    const result = main();
    return res.json({
        result
    });
});

function main() {
    const lista = sorteiaLista()
    const listaOrdenada = insertionSort(lista);
    console.log("lista ordenada: ", listaOrdenada);
}