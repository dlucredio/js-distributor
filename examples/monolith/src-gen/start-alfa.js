import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import {
    sub
} from "./functions-gama.js";
app.get('/isAEqualToB', async (req, res) => {
    const a = req.query.a;
    const b = req.query.b;
    const result = await isAEqualToB(a, b);
    return res.json({
        result
    });
});
async function isAEqualToB(a, b) {
    const subResult = await sub(a, b);
    if (subResult === 0)
        return true;
    else return false;
}