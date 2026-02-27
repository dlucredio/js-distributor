import express from 'express';
import {
    getFullName_localRef as getFullName
} from "./app.js";
const app = express();
const port = 3001;
app.use(express.json());

// HTTP GET functions

// HTTP POST functions

app.post('/getFullName', (requestParameter, responseParameter) => {
    const firstName = requestParameter.body.firstName;
    const lastName = requestParameter.body.lastName;
    const executionResult = getFullName(firstName, lastName);
    return responseParameter.json({
        executionResult
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});