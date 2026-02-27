import express from 'express';
import {
    generateId_localRef as generateId,
    createUser_localRef as createUser
} from "./app.js";
const app = express();
const port = 3000;
app.use(express.json());
app.get('/generateId', (requestParameter, responseParameter) => {
    const prefix = requestParameter.query.prefix;
    const executionResult = generateId(prefix);
    return responseParameter.json({
        executionResult
    });
});
app.post('/createUser', async (requestParameter, responseParameter) => {
    const email = requestParameter.body.email;
    const name = requestParameter.body.name;
    const executionResult = await createUser(email, name);
    return responseParameter.json({
        executionResult
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});