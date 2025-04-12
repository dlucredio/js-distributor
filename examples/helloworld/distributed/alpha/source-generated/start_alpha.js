import express from 'express';


import {
    saveCustomer_localRef as saveCustomer
} from "./database/customer.js";
import {
    saveProduct_localRef as saveProduct
} from "./database/product.js";
import {
    main_localRef as main
} from "./main.js";
import {
    toLowerCase_localRef as toLowerCase
} from "./util/strings.js";


const app = express();
const port = 3000;
app.use(express.json());

// routes

app.get('/saveCustomer', async (req, res) => {
    const name = req.query.name;
    const address = req.query.address;
    const age = req.query.age;
    const email = req.query.email;
    const number = req.query.number;
    const ssn = req.query.ssn;
    const result = saveCustomer(name, address, age, email, number, ssn);
    return res.json({
        result
    });
});

app.get('/saveProduct', async (req, res) => {
    const id = req.query.id;
    const name = req.query.name;
    const result = await saveProduct(id, name);
    return res.json({
        result
    });
});

app.get('/main', async (req, res) => {

    const result = main();
    return res.json({
        result
    });
});

app.get('/toLowerCase', async (req, res) => {
    const str = req.query.str;
    const result = toLowerCase(str);
    return res.json({
        result
    });
});


app.listen(port, () => {
    console.log('Server running in port ' + port);
});