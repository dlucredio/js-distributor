import * as strUtils from './util/strings.js';
import lists, { log } from './util/lists.js';
import { main2 } from "./main2.js";

export default async function main() {
    let lowerCase = strUtils.toLowerCase("HELLO,World,everyONE!");
    const upperCase = strUtils.toUpperCase(lowerCase);
    let list = strUtils.split(upperCase, ",");
    lists.push(list, "ANOTHER WORD");
    let backToString = strUtils.join(list);

    console.log(lowerCase);
    console.log(upperCase);
    log(list);
    console.log(backToString);

    const ret = await main2();

    console.log("Done");

    return ret;

}