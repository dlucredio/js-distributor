import express from 'express';
const app = express();
const port = 3001;
app.use(express.json());
app.listen(port, () => {
  console.log('Server running in port ' + port);
});
import amqp from 'amqplib';import pkg from 'pg';
const { Client } = pkg ;
const connectionString  = 'postgresql://db:db@localhost:5432/db';

import {
    generateKey
} from "./functions-delta.js";
app.post('/insertUser', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const result = await insertUser(email, name);
    return res.json({
        result
    });
});
async function insertUser(email, name) {
    console.log(`Starting user creation: email=${email}, name=${name}`);
    console.log(`Generating id...`);
    const id = await generateKey(email);
    console.log(`Generated id ${id}, now connecting to database...`);
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        console.log('Connected to the database!');
        const query = 'INSERT INTO Users (id, email, name) VALUES ($1, $2, $3);';

        console.log('Inserting user...');
        await client.query(query, [id, email, name]);
        console.log('User inserted successfully');
    } catch (error) {
        console.error('Error inserting user:', error);
    } finally {
        await client.end();
    }
}
app.get('/findUserByEmail', async (req, res) => {
    const email = req.query.email;
    const result = await findUserByEmail(email);
    return res.json({
        result
    });
});
async function findUserByEmail(email) {
    console.log(`Trying to find user with email=${email}`);
    console.log(`Connecting to database...`);
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        console.log('Connected to the database!');
        const query = 'SELECT * FROM Users WHERE email = $1;';

        const result = await client.query(query, [email]);

        console.log('Query executed!');
        return result.rows[0];

    } catch (error) {
        console.error('Error finding user:', error);
    } finally {
        await client.end();
    }
}