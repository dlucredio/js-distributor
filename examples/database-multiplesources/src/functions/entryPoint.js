import { insertUser, findUserByEmail, deleteAllUsers } from "./db/database.js";

export async function entryPoint() {
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