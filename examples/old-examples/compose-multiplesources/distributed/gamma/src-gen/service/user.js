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
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        const query = "SELECT * FROM Users WHERE name = $1;";

        const result = await client.query(query, [userId]);

        return result.rows || null;

    } catch (error) {
        console.error("Error fetching user:", error);
        return null;

    } finally {
        await client.end();
    }
}
async function updateUser(userId, updatedData) {
    const client = new Client({
        connectionString: connectionString
    });
    try {
        await client.connect();
        const fields = Object.keys(updatedData).map((key, index) => `${key} = $${index+2}`).join(", ");

        const values = Object.values(updatedData);

        const query = `UPDATE Users SET ${fields} WHERE name = $1 RETURNING *;`;

        const result = await client.query(query, [userId, ...values]);

        return result.rows[0] || null;

    } catch (error) {
        console.error("Error updating user:", error);
        return null;

    } finally {
        await client.end();
    }
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
    getUserById as getUserById_localRef, updateUser as updateUser_localRef
};