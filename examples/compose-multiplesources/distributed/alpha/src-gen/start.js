import express from 'express';
import {
    main_localRef as main
} from "./main.js";
const app = express();
const port = 3000;
app.use(express.json());
app.get('/main', async (req, res) => {
    const name = req.query.name;
    const email = req.query.email;
    const result = await main(name, email);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});