async function toUpperCaseString(str) {
    const response = await fetch(`http://localhost:3000/toUpperCaseString?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
async function toLowerCaseString(str) {
    const response = await fetch(`http://localhost:3001/toLowerCaseString?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
export {
    toUpperCaseString,
    toLowerCaseString
};