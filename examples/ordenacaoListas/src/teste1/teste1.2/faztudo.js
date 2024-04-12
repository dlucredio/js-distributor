import { imprimeTresValores } from "../../../src-gen/modifiedNode-alfa";
import { multiplicaListaPassada } from "../../../src-gen/modifiedNode-gama";
import { insertionSort } from "../../../src-gen/modifiedNode-server4";
import { sorteiaLista } from "../teste1.1/ordenaListas";

function fazTudoComLista() {
    const lista = sorteiaLista();

    const multiplicacao = multiplicaListaPassada(lista);

    const listaOrdenada = insertionSort(lista);

    imprimeTresValores(lista, listaOrdenada, multiplicacao)
}


export function subtraiNumero(a, b) {
    return a - b;
}

export function checkEhPositivo(x) {
    const retorno = sub_rabbit(0, x);

    if (retorno < 0) return `${x} eh positivo`;
    else return `${x} eh negativo`;
}