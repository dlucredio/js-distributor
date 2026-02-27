import express from 'express';
import {
    toUpperCaseString_localRef as toUpperCaseString
} from "./helpers/util.js";
const app = express();
const port = 3000;
app.use(express.json());
app.get('/toUpperCaseString', (req, res) => {
    const str = req.query.str;
    const result = toUpperCaseString(str);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});