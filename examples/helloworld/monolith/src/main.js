import * as strUtils from './util/strings.js';

function main() {
    console.log("Hello");
    let lowerCase = strUtils.toLowerCase("HELLO,World,everyONE!");
    const upperCase = strUtils.toUpperCase(lowerCase);
    let list = strUtils.split(upperCase, ",");
    let backToString = strUtils.join(list);

    console.log(lowerCase);
    console.log(upperCase);
    console.log(list);
    console.log(backToString);

}

export default main;