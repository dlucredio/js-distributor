function sorteiaNumero() {
    const response = fetch('http://random:5000/sorteiaNumero');
    const result = response.json();
    return result;
}

function sorteiaLista() {
    const response = fetch('http://random:5000/sorteiaLista');
    const result = response.json();
    return result;
}