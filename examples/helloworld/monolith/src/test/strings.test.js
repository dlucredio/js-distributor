import { toLowerCase, toUpperCase, split, join } from '../util/strings.js';
import { saveCustomer } from '../database/customer.js';
import { saveProduct } from '../database/product.js';
// examples/helloworld/monolith/src/util/strings.test.js
describe('Use Database',  () => {
    test('Should return customer', async () => {
        const entryObject = {
            name: "Lumi",
            address: "Rua das Flores",
            age: 12,
            email: "asd@asd",
            number: 123456789,
            ssn: "123-45-6789"
        }
        const expectedObject = {
            name: "Lumi",
            address: "Rua das Flores",
            age: 12,
            email: "asd@asd",
            number: 123456789,
            ssn: "123-45-6789"
        }
        const result = await saveCustomer(entryObject.name, entryObject.address, entryObject.age,
             entryObject.email, entryObject.number, entryObject.ssn);
        expect(result).toEqual(expectedObject);
    });

    test('Should return product', () => {
        const entryObject = {
            id: 1,
            name: "Lumi"
        }
        const expectedObject = {
            id: 1,
            name: "LUMI"
        }
        const result = saveProduct(entryObject.id, entryObject.name);
        expect(result).toEqual(expectedObject);
    });

})