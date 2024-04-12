import express from 'express';
const app = express();
const port = 3000;
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
import {
    deleteAllUsers
} from "./functions-beta.js";
import {
    findUserByEmail
} from "./functions-beta.js";
import {
    insertUser
} from "./functions-beta.js";
app.get('/entryPoint', async (req, res) => {
    const result = await entryPoint();
    return res.json({
        result
    });
});
async function entryPoint() {
    console.log("Starting the application");
    await insertUser("daniel@email.com", "Daniel");
    console.log('Inserted user');
    const newUser = await findUserByEmail('daniel@email.com');
    console.log('New user created');
    console.log(newUser);
    await deleteAllUsers();
    console.log('All users deleted');
    return newUser;
}