import fetch from 'node-fetch';
export async function sorteiaLista() {
    const response = await fetch('http://localhost:1111/sorteiaLista', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
    });
    const {
        result
    } = await response.json();
    return result;
}