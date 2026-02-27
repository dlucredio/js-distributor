import express from 'express';
import {
    main_merge_localRef as main_merge
} from "./app.js";
const app = express();
const port = 3000;
app.use(express.json());

// HTTP GET functions

app.get('/main_merge', async (requestParameter, responseParameter) => {
    const executionResult = await main_merge();
    return responseParameter.json({
        executionResult
    });
});

// HTTP POST functions

app.listen(port, () => {
    console.log('Server running in port ' + port);
});