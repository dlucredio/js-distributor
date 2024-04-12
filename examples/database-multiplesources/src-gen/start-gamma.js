import express from 'express';
const app = express();
const port = 3002;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

app.post('/generateKey', async (req, res) => {
    const prefix = req.body.prefix;
    const undefined = req.body.undefined;
    const result = generateKey(prefix, );
    return res.json({
        result
    });
});

function generateKey(prefix, ) {
    console.log(`Generating key with prefix '${prefix}'`);
    const key = prefix + ":" + uuidv4();
    return key;
}