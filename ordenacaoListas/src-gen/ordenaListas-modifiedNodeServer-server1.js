import {
    ordenaListas
} from "./ordenaListas-modifiedNode-server5.js";
import {
    sorteiaLista
} from "./ordenaListas-modifiedNode-server3.js";
import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.get('/main', async (req, res) => {
    console.log("chegou na rota da funcao main");
    const result = await main();
    return res.json({
        result
    });
});
async function main() {
    const lista = await sorteiaLista();
    const listaOrdenada = await ordenaListas(lista, 'selectionSort', 'selection sort');
    console.log("lista ordenada: ", listaOrdenada);
    return 'sucesso';
}