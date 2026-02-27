import {
    toLowerCaseString,
    toUpperCaseString as tuc
} from './helpers/util.js';
export async function main() {
    console.log("Running main...");
    print("world");
    print(await toLowerCaseString("world"));
    print(await tuc("WORLD"));
}

function print(message) {
    console.log("Hello: " + message);
}
export {
    print as print_localRef
};