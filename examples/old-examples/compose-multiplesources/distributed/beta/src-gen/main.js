import userservice from "./service/user.js";
export async function main(name, email) {
    const response = await fetch(`http://alpha:3000/main?name=${name}&email=${email}`);
    const {
        result
    } = await response.json();
    return result;
}