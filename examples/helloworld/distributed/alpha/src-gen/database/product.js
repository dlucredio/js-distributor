import {
    toUpperCase
} from "../util/strings.js";
export function saveProduct(id, name = "produto") {
    const nomeProd = toUpperCase(name);
    console.log(`Saving product: ${id}, ${nomeProd}`);
    return {
        id: id,
        name: nomeProd
    };
}
export {
    saveProduct as saveProduct_localRef
};