import {
    toLowerCaseString,
    toUpperCaseString as tuc
} from './helpers/util.js';
export async function main() {
    const response = await fetch(`http://localhost:3000/main`);
    const {
        result
    } = await response.json();
    return result;
}

function print(message_arg) {
    console.log("Hello: " + message_arg);
}
export {
    print as print_localRef
};