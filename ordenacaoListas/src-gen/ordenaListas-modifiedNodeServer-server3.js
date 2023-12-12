import {
    sorteiaNumero
} from "./ordenaListas-modifiedNode-server2.js";
import express from 'express';
const app = express();
const port = 1111;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.post('/sorteiaLista', async (req, res) => {
    console.log("chegou na rota da funcao sorteiaLista");
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