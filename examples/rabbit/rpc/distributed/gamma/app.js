async function main_merge() {
    const response = await fetch(`http://localhost:3000/main_merge`);
    const {
        executionResult
    } = await response.json();
    return executionResult;
}
async function main_quick() {
    const response = await fetch(`http://localhost:3001/main_quick`);
    const {
        executionResult
    } = await response.json();
    return executionResult;
}

function sortArray(array, algorithm = "merge") {
    console.log(`Sorting using: ${algorithm}`);
    const input = [...array];
    if (algorithm === "merge") {
        return mergeSort(input, 0);
    }
    if (algorithm === "quick") {
        return quickSort(input, 0);
    }
    throw new Error("Unknown sorting algorithm");
}

function mergeSort(arr, depth) {
    console.log(`${indent(depth)}mergeSort(${JSON.stringify(arr)})`);
    if (arr.length <= 1) {
        console.log(`${indent(depth)}return`, arr);
        return arr;
    }
    const middle = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, middle), depth + 1);
    const right = mergeSort(arr.slice(middle), depth + 1);
    const merged = merge(left, right, depth);
    console.log(`${indent(depth)}merged ->`, merged);
    return merged;
}

function merge(left, right, depth) {
    console.log(`${indent(depth)}merge ${JSON.stringify(left)} + ${JSON.stringify(right)}`);
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    return [...result, ...left.slice(i), ...right.slice(j)];
}

function quickSort(arr, depth) {
    console.log(`${indent(depth)}quickSort(${JSON.stringify(arr)})`);
    if (arr.length <= 1) {
        console.log(`${indent(depth)}return`, arr);
        return arr;
    }
    const pivot = arr[arr.length - 1];
    const left = [];
    const right = [];
    console.log(`${indent(depth)}pivot = ${pivot}`);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    console.log(`${indent(depth)}left=${JSON.stringify(left)} right=${JSON.stringify(right)}`);
    const result = [...quickSort(left, depth + 1), pivot, ...quickSort(right, depth + 1)];
    console.log(`${indent(depth)}combined ->`, result);
    return result;
}

function indent(depth) {
    return "  ".repeat(depth);
}
async function main() {
    await main_merge();
    await main_quick();
}
export default main;
export {
    sortArray as sortArray_localRef
};