import express from 'express';
import {
    main_quick_localRef as main_quick
} from "./app.js";
const app = express();
const port = 3001;
app.use(express.json());

// HTTP GET functions

app.get('/main_quick', async (requestParameter, responseParameter) => {
    const executionResult = await main_quick();
    return responseParameter.json({
        executionResult
    });
});

// HTTP POST functions

app.listen(port, () => {
    console.log('Server running in port ' + port);
});