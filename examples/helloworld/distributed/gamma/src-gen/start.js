import express from 'express';
import {
    main_localRef as main
} from "./main.js";
const app = express();
const port = 3002;
app.use(express.json());
app.get('/main', async (req, res) => {
    const result = await main();
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});