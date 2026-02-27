import express from 'express';
import {
    getMessage_localRef as getMessage
} from "./app.js";
const app = express();
const port = 3000;
app.use(express.json());

// HTTP GET functions

app.get('/getMessage', (requestParameter, responseParameter) => {
    const greeting = requestParameter.query.greeting;
    const person = requestParameter.query.person;
    const executionResult = getMessage(greeting, person);
    return responseParameter.json({
        executionResult
    });
});

// HTTP POST functions

app.listen(port, () => {
    console.log('Server running in port ' + port);
});