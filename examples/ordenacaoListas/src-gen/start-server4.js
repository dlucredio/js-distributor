import express from 'express';
const app = express();
const port = 2222;
app.use(express.json());
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port);
});
import amqp from 'amqplib';
app.post('/selectionSort', async (req, res) => {
    const arr = req.body.arr;
    const result = selectionSort(arr);
    return res.json({
        result
    });
});

function selectionSort(arr) {
    var n = arr.length;
    for (var i = 0; i < n - 1; i++) {
        var minIndex = i;

        for (var j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        var temp = arr[minIndex];

        arr[minIndex] = arr[i];
        arr[i] = temp;
    }
    return arr;
}
app.get('/deTeste', async (req, res) => {
    const booleano = req.query.booleano;
    const result = deTeste(booleano);
    return res.json({
        result
    });
});

function deTeste(booleano) {
    console.log("retornando ", booleano);
    if (booleano === "true")
        return booleano;
    else if (booleano === "false")
        return booleano;
}