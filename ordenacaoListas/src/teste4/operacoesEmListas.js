import { sorteiaLista } from '../teste1/teste1.1/ordenaListas.js'
import { multiplicaNumeros } from '../teste3/teste3.3/operacoes.js'

function multiplicaLista(){
    const lista = sorteiaLista();
    let mult = 1;
    lista.forEach((item) => {
        mult = multiplicaNumeros(mult, item);
    })
    console.log('lista', lista);
    console.log('mult', mult);
    return mult;
}

function multiplicaListaPassada(lista) {
    let mult = 1;
    lista.forEach((item) => {
        mult = multiplicaNumeros(mult, item);
    })

    console.log('lista', lista);
    console.log('mult', mult);
    return mult;
}

function randomZeroUm() {
    const listaZeroMult = multiplicaLista();
    const listaUmMult = multiplicaLista();

    if (listaZeroMult > listaUmMult) {
        console.log('sorteio zero com multiplicacao', listaZeroMult);
        return 0;
    } else {
        console.log('sorteio um ganhou com multiplicacao', listaUmMult);
        return 1;
    }
}

multiplicaLista();
randomZeroUm();