export function toLowerCase(str) {
    console.log("toLowerCase(" + str + ")");
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
export function toUpperCase(str) {
    console.log("toUpperCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (code >= 97 && code <= 122) {
            result += String.fromCharCode(code - 32);
        } else {
            result += str[i];
        }
    }
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
    const response = await fetch(`http://localhost:3001/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "arr": arr,
            "separator": separator
        })
    });
    const {
        result
    } = await response.json();
    return result;
}