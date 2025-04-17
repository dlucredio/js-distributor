import * as strUtils from './util/strings.js';
import lists, {
    log
} from './util/lists.js';
import {
    main2
} from "./main2.js";
export async function main() {
    let lowerCase = strUtils.toLowerCase("HELLO,World,everyONE!");
    const upperCase = strUtils.toUpperCase(lowerCase);
    let list = await strUtils.split(upperCase, ",");
    lists.push(list, "ANOTHER WORD");
    let backToString = strUtils.join(list);
    console.log(lowerCase);
    console.log(upperCase);
    await log(list);
    console.log(backToString);
    const ret = await main2();
    console.log("Done");
    return ret;
}
export {
    main as main_localRef
};