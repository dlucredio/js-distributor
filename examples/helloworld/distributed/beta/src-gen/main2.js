import {
    saveCustomer
} from "./database/customer.js";
import {
    saveProduct
} from "./database/product.js";
export async function main2() {
    await saveCustomer("name1", "address1", "34", "email@email.com", "number1", "ssn1234");
    await saveProduct(1234);
}