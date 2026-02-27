import express from 'express';
import {
    main_localRef as main
} from "./app.js";
const app = express();
const port = 3001;
app.use(express.json());
app.get('/main', async (requestParameter, responseParameter) => {
    const executionResult = await main();
    return responseParameter.json({
        executionResult
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});