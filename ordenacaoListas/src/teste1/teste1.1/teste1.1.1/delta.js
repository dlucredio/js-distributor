import { testeDeltaMaiorQueZero } from "../../teste1.2/teste1.2";

export function deltaFunction(a, b, c) {
    console.log("delta maior que zero?", testeDeltaMaiorQueZero(b * b - 4 * a * c))
    return b * b - 4 * a * c;
}
