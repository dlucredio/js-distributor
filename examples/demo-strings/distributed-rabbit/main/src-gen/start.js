import express from 'express';
import {
    main_localRef as main
} from "./main.js";
const app = express();
const port = 3000;
app.use(express.json());
app.get('/main', (req, res) => {
    const result = main();
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});