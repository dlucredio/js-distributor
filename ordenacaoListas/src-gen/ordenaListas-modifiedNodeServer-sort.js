/*---servidor sort---*/
const express = require('express');
const app = express();
const port = 8080;
app.use(express.json());
app.listen(port, () => {
    console.log('Servidor rodando na porta ' + port);
});
app.get('/insertionSort', async (req, res) => {
    const inputArr = req.query.inputArr;
    const result = insertionSort(inputArr);
    return res.json({
        result
    });
});

function insertionSort(inputArr) {
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
    return inputArr;
}