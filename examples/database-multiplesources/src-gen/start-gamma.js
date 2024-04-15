import express from 'express';
const app = express();
const port = 3002;
app.use(express.json());
app.listen(port, () => {
  console.log('Server running in port ' + port);
});
import amqp from 'amqplib';import pkg from 'pg';
const { Client } = pkg ;
const connectionString  = 'postgresql://db:db@localhost:5432/db';

app.get('/deleteAllUsers', async (req, res) => {
    const result = await deleteAllUsers();
    return res.json({
        result
    });
});
async function deleteAllUsers() {
    console.log(`Deleting all users`);
    console.log(`Connecting to database...`);
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        console.log('Connected to the database!');
        const query = 'DELETE FROM Users;';

        await client.query(query, []);
        console.log('Query executed!');
    } catch (error) {
        console.error('Error finding user:', error);
    } finally {
        await client.end();
    }
}