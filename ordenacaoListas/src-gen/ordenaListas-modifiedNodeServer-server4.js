import {
    imprimeLista
} from "./ordenaListas-modifiedNode-server5.js";
import express from 'express';
const app = express();
const port = 2222;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.post('/selectionSort', async (req, res) => {
    console.log("chegou na rota da funcao selectionSort");
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
app.post('/insertionSort', async (req, res) => {
    console.log("chegou na rota da funcao insertionSort");
    const inputArr = req.body.inputArr;
    const result = await insertionSort(inputArr);
    return res.json({
        result
    });
});
async function insertionSort(inputArr) {
    let n = inputArr.length;
    for (let i = 1; i < n; i++) {
        let current = inputArr[i];

        let j = i - 1;

        while ((j > -1) && (current < inputArr[j])) {
            inputArr[j + 1] = inputArr[j];
            j--;
        }
        inputArr[j + 1] = current;
    }
    await imprimeLista("resultado da lista ordenada:", inputArr);
    return inputArr;
}