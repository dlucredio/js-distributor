import { toLowerCaseString, toUpperCaseString as tuc} from './helpers/util.js';

export function main() {
    console.log("Running main...");
    print("world");
    print(toLowerCaseString("world"));
    print(tuc("WORLD"));
}

function print(message_arg) {
    console.log("Hello: "+message_arg);
}