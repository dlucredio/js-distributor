export function toLowerCase(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (code >= 65 && code <= 90) {
            result += String.fromCharCode(code + 32);
        } else {
            result += str[i];
        }
    }
    return result;
}
export async function toUpperCase(str) {
    const response = await fetch(`http://localhost:3001/toUpperCase?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
export async function split(str, separator = ",") {
    const response = await fetch(`http://localhost:3001/split?str=${str}&separator=${separator}`);
    const {
        result
    } = await response.json();
    return result;
}
export async function join(arr, separator = ',') {
    const response = await fetch(`http://localhost:3001/join?arr=${arr}&separator=${separator}`);
    const {
        result
    } = await response.json();
    return result;
}
export {
    toLowerCase as toLowerCase_localRef,
};