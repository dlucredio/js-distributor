import express from 'express';
import {
    print_localRef as print
} from "./main.js";
const app = express();
const port = 3002;
app.use(express.json());
app.get('/print', (req, res) => {
    const message = req.query.message;
    const result = print(message);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});