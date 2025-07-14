import {
    v4 as uuidv4
} from 'uuid';
import {
    MongoClient
} from 'mongodb';
async function generateId(prefix) {
    const response = await fetch(`http://localhost:3000/generateId?prefix=${prefix}`);
    const {
        executionResult
    } = await response.json();
    return executionResult;
}
async function createUser(email, name) {
    const response = await fetch(`http://localhost:3000/createUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "email": email,
            "name": name
        })
    });
    const {
        executionResult
    } = await response.json();
    return executionResult;
}
export default async function main() {
    console.log(`Running application...`);
    await createUser("user@email.com", "John Doe");
    console.log(`Done!`);
}
export {
    main as main_localRef
};