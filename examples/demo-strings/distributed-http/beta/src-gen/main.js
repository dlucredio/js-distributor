import {
    toLowerCaseString,
    toUpperCaseString as tuc
} from './helpers/util.js';
export async function main() {
    console.log("Running main...");
    await print("world");
    await print(toLowerCaseString("world"));
    await print(await tuc("WORLD"));
}
async function print(message) {
    const response = await fetch(`http://localhost:3002/print?message=${message}`);
    const {
        result
    } = await response.json();
    return result;
}