import express from 'express';
const app = express();
const port = 3001;
app.use(express.json());
app.listen(port, () => {
  console.log('Server running in port ' + port);
});
import amqp from 'amqplib';
app.post('/sub', async (req, res) => {
    const a = req.body.a;
    const b = req.body.b;
    const result = sub(a, b);
    return res.json({
        result
    });
});

function sub(a, b) {
    return a - b;
}