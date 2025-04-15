import * as strUtils from './util/strings.js';
import lists, {
    log
} from './util/lists.js';
import {
    main2
} from "./main2.js";
async function main() {
    const response = await fetch(`http://gamma:3002/main`);
    const {
        result
    } = await response.json();
    return result;
}