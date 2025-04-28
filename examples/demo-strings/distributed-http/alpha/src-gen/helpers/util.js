function toUpperCaseString(str) {
    console.log("Estou no toUpperCaseString");
    return str.toUpperCase();
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
export {
    toUpperCaseString as toUpperCaseString_localRef
};