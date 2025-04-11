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