import express from 'express';
import {
    getUserById_localRef as getUserById,
    updateUser_localRef as updateUser
} from "./service/user.js";
const app = express();
const port = 3002;
app.use(express.json());
app.get('/getUserById', async (req, res) => {
    const userId = req.query.userId;
    const result = await getUserById(userId);
    return res.json({
        result
    });
});
app.post('/updateUser', async (req, res) => {
    const userId = req.body.userId;
    const updatedData = req.body.updatedData;
    const result = await updateUser(userId, updatedData);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});