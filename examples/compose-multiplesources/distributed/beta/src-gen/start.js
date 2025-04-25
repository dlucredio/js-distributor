import express from 'express';
import {
    createUser_localRef as createUser
} from "./service/user.js";
const app = express();
const port = 3001;
app.use(express.json());
app.post('/createUser', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const result = await createUser(name, email);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});