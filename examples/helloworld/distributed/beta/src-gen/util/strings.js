export async function toLowerCase(str) {
    const response = await fetch(`http://localhost:3000/toLowerCase?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
export async function toUpperCase(str) {
    const response = await fetch(`http://localhost:3000/toUpperCase?str=${str}`);
    const {
        result
    } = await response.json();
    return result;
}
export async function split(str, separator = ",") {
    const response = await fetch(`http://localhost:3000/split?str=${str}&separator=${separator}`);
    const {
        result
    } = await response.json();
    return result;
}
export async function join(arr, separator = ',') {
    const response = await fetch(`http://localhost:3000/join?arr=${arr}&separator=${separator}`);
    const {
        result
    } = await response.json();
    return result;
}