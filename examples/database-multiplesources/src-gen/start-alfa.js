import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => {
  console.log('Server running in port ' + port);
});
import amqp from 'amqplib';
import {
    deleteAllUsers
} from "./functions-gamma.js";
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