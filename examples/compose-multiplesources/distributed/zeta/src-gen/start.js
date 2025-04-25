import express from 'express';
import {
    deleteUser_localRef as deleteUser
} from "./service/user.js";
const app = express();
const port = 3003;
app.use(express.json());
app.get('/deleteUser', async (req, res) => {
    const userId = req.query.userId;
    const result = await deleteUser(userId);
    return res.json({
        result
    });
});
app.listen(port, () => {
    console.log('Server running in port ' + port);
});