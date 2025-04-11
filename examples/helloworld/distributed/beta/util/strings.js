export async function toLowerCase(str) {
    const response = await fetch(`http://localhost:3002/toLowerCase?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
export async function toUpperCase(str) {
    const response = await fetch(`http://localhost:3002/toUpperCase?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
export function split(str, separator = ",") {
    let result = [];
    let temp = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] === separator) {
            result.push(temp);
            temp = '';
        } else {
            temp += str[i];
        }
    }
    result.push(temp);
    return result;
}
export function join(arr, separator = ',') {
    console.log("Joining...");
    let result = '';
    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
        if (i < arr.length - 1) {
            result += separator;
        }
    }
    return result;
}