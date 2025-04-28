import express from 'express';
import {
    toLowerCaseString_localRef as toLowerCaseString
} from "./helpers/util.js";
const app = express();
const port = 3001;
app.use(express.json());
app.get('/toLowerCaseString', (req, res) => {
    const str = req.query.str;
    const result = toLowerCaseString(str);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});