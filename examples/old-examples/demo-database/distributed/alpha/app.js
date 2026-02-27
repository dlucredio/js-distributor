import {
    v4 as uuidv4
} from 'uuid';
import {
    MongoClient
} from 'mongodb';

function generateId(prefix) {
    console.log(`Generating ID with prefix: ${prefix}`);
    return `[${prefix}:${uuidv4()}]`;
}
async function createUser(email, name) {
    console.log(`Create: email=${email}, name=${name}`);
    const id = generateId(email);
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    await client.db('db').collection('Users').insertOne({
        _id: id,
        email,
        name
    });
    console.log('User inserted successfully');
    await client.close();
}
export default async function main() {
    const response = await fetch(`http://localhost:3001/main`);
    const {
        executionResult
    } = await response.json();
    return executionResult;
}
export {
    generateId as generateId_localRef, createUser as createUser_localRef
};