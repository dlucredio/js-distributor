import userservice from "./service/user.js";
export async function main(name, email) {
  try {
    const createdUser = await userservice.createUser(name, email);
    console.log("Created User:", createdUser);
    console.log("-------------");
    const user = await userservice.getUserById(name);
    console.log("Fetched User:", user);
    console.log("-------------");
    console.log("Deleting user......");
    await userservice.deleteUser(name);
    return user;
  } catch (error) {
    console.error("Error performing CRUD operations:", error);
  }
}
