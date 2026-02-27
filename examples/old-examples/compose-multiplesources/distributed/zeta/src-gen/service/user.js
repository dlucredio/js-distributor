import pkg from "pg";
const {
    Client
} = pkg;
const connectionString = "postgresql://db:db@db:5432/db";
async function createUser(name, email) {
    const response = await fetch(`http://beta:3001/createUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "name": name,
            "email": email
        })
    });
    const {
        result
    } = await response.json();
    return result;
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
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        const query = "DELETE FROM Users WHERE name = $1;";

        const result = await client.query(query, [userId]);

        return result.rowCount > 0;

    } catch (error) {
        console.error("Error deleting user:", error);
        return false;

    } finally {
        await client.end();
    }
}
export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser
};
export {
    deleteUser as deleteUser_localRef
};