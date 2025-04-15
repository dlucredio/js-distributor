import express from 'express';
import {
    log_localRef as log
} from "./util/lists.js";
import {
    split_localRef as split,
    join_localRef as join
} from "./util/strings.js";
const app = express();
const port = 3001;
app.use(express.json());
app.get('/split', (req, res) => {
    const str = req.query.str;
    const separator = req.query.separator;
    const result = split(str, separator);
    return res.json({
        result
    });
});
app.post('/log', (req, res) => {
    const list = req.body.list;
    const result = log(list);
    return res.json({
        result
    });
});
app.post('/join', (req, res) => {
    const arr = req.body.arr;
    const separator = req.body.separator;
    const result = join(arr, separator);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});