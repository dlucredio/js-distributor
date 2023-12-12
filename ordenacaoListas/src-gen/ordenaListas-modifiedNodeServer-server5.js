import {
    insertionSort
} from "./ordenaListas-modifiedNode-server4.js";
import {
    selectionSort
} from "./ordenaListas-modifiedNode-server4.js";
import express from 'express';
const app = express();
const port = 3333;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.post('/ordenaListas', async (req, res) => {
    console.log("chegou na rota da funcao ordenaListas");
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
    return await insertionSort(lista);
}
app.post('/imprimeLista', async (req, res) => {
    console.log("chegou na rota da funcao imprimeLista");
    const msg = req.body.msg;
    const lista = req.body.lista;
    const result = imprimeLista(msg, lista);
    return res.json({
        result
    });
});

function imprimeLista(msg, lista) {
    console.log(msg, lista);
    console.log("funcao de teste retornou: ", deTeste());
}
app.get('/deTeste', async (req, res) => {
    console.log("chegou na rota da funcao deTeste");
    const result = deTeste();
    return res.json({
        result
    });
});

function deTeste() {
    return True;
}