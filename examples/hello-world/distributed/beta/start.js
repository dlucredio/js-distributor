import express from 'express';
import {
    getMessage_localRef as getMessage
} from "./app.js";
const app = express();
const port = 3000;
app.use(express.json());

// HTTP GET functions

// HTTP POST functions

app.post('/getMessage', (requestParameter, responseParameter) => {
    const greeting = requestParameter.body.greeting;
    const person = requestParameter.body.person;
    const executionResult = getMessage(greeting, person);
    return responseParameter.json({
        executionResult
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});