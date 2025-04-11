import * as strUtils from './util/strings.js';
async function main() {
    const response = await fetch(`http://localhost:3000/main`);
    const {
        result
    } = await response.json();
    return result;
}
export default main;