async function toUpperCaseString(str) {
    const response = await fetch(`http://localhost:3000/toUpperCaseString?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}

function toLowerCaseString(str) {
    console.log("Estou no toLowerCaseString");
    return str.toLowerCase();
}
export {
    toUpperCaseString,
    toLowerCaseString
};
export {
    toLowerCaseString as toLowerCaseString_localRef
};