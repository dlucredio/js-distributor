import express from 'express';


import {
    toUpperCase_localRef as toUpperCase,
    split_localRef as split,
    join_localRef as join
} from "./util/strings.js";


const app = express();
const port = 3001;
app.use(express.json());

// routes

app.get('/toUpperCase', async (req, res) => {
    const str = req.query.str;
    const result = toUpperCase(str);
    return res.json({
        result
    });
});

app.get('/split', async (req, res) => {
    const str = req.query.str;
    const separator = req.query.separator;
    const result = split(str, separator);
    return res.json({
        result
    });
});

app.get('/join', async (req, res) => {
    const arr = req.query.arr;
    const separator = req.query.separator;
    const result = join(arr, separator);
    return res.json({
        result
    });
});


app.listen(port, () => {
    console.log('Server running in port ' + port);
});