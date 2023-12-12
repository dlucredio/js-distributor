import fetch from 'node-fetch';
export async function sorteiaNumero(n, argTeste) {
    const response = await fetch('http://localhost:5000/sorteiaNumero?n=' + n + '&argTeste=' + argTeste);
    const {
        result
    } = await response.json();
    return result;
}