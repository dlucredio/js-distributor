import { imprimeTresValores } from "../../../src-gen/modifiedNode-alfa";
import { deltaFunction } from "../teste1.1/teste1.1.1/delta";

function calcularBhaskara(a, b, c) {
    // Calcula o discriminante
    console.log("coeficientes: ");
    imprimeTresValores(a, b, c);
    const delta = deltaFunction(a, b, c) / 1;

    // Verifica se as raízes são reais
    if (delta < 0) {
        return "A equação não possui raízes reais.";
    }

    // Calcula as raízes
    const x1 = subtraiNumero(Math.sqrt(delta), b) / (2 * a);
    const x2 = subtraiNumero(-Math.sqrt(delta), b) / (2 * a);

    // Retorna as raízes
    return { x1, x2 };
}

export function testeDeltaMaiorQueZero(delta) {
    return (delta > 0);
}