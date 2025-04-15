import express from 'express';
import {
    saveCustomer_localRef as saveCustomer
} from "./database/customer.js";
import {
    saveProduct_localRef as saveProduct
} from "./database/product.js";
const app = express();
const port = 3000;
app.use(express.json());
app.get('/saveCustomer', async (req, res) => {
    const name = req.query.name;
    const address = req.query.address;
    const age = req.query.age;
    const email = req.query.email;
    const number = req.query.number;
    const ssn = req.query.ssn;
    const result = await saveCustomer(name, address, age, email, number, ssn);
    return res.json({
        result
    });
});
app.get('/saveProduct', (req, res) => {
    const id = req.query.id;
    const name = req.query.name;
    const result = saveProduct(id, name);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});