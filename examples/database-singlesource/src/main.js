import { v4 as uuidv4 } from 'uuid';
import pkg from 'pg';
const { Client } = pkg;

function generateKey(prefix) {
    console.log(`Generating key with prefix '${prefix}'`);
    const key = prefix + ":::" + uuidv4();
    return key;
}

const connectionString = 'postgresql://db:db@localhost:5432/db';

async function insertUser(email, name) {
    console.log(`Starting user creation: email=${email}, name=${name}`);
    console.log(`Generating id...`);

    const id = generateKey(email);
    console.log(`Generated id ${id}, now connecting to database...`);

    const client = new Client({ connectionString: connectionString });

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

async function findUserByEmail(email) {
    console.log(`Trying to find user with email=${email}`);
    console.log(`Connecting to database...`);

    const client = new Client({ connectionString: connectionString });

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

async function deleteAllUsers() {
    console.log(`Deleting all users`);
    console.log(`Connecting to database...`);

    const client = new Client({ connectionString: connectionString });

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