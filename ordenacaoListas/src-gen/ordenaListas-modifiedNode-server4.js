import fetch from 'node-fetch';
export async function selectionSort(arr) {
    let body = {
        arr: arr,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:2222/selectionSort', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}
export async function insertionSort(inputArr) {
    let body = {
        inputArr: inputArr,
    };
    body = JSON.stringify(body);
    const response = await fetch('http://localhost:2222/insertionSort', {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: body
    });
    const {
        result
    } = await response.json();
    return result;
}