import pkg from "pg";
const {
    Client
} = pkg;
const connectionString = "postgresql://db:db@db:5432/db";
async function createUser(name, email) {
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        const query = "INSERT INTO Users (email, name) VALUES ($1, $2);";

        console.log("Inserting user...");
        await client.query(query, [email, name]);
        console.log("User inserted successfully");
        return name;

    } catch (error) {
        console.error("Error inserting user:", error);
    } finally {
        await client.end();
    }
}
async function getUserById(userId) {
    const response = await fetch(`http://gamma:3002/getUserById?userId=${userId}`);
    const {
        result
    } = await response.json();
    return result;
}
async function updateUser(userId, updatedData) {
    const response = await fetch(`http://gamma:3002/updateUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "userId": userId,
            "updatedData": updatedData
        })
    });
    const {
        result
    } = await response.json();
    return result;
}
async function deleteUser(userId) {
    const response = await fetch(`http://zeta:3003/deleteUser?userId=${userId}`);
    const {
        result
    } = await response.json();
    return result;
}
export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser
};
export {
    createUser as createUser_localRef
};