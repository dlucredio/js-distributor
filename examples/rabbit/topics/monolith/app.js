function main() {
    const data = [8, 3, 5, 1, 9, 2];


    console.log("\n--- MERGE SORT ---");
    console.log("Original array:", data);
    console.log("================================");

    const mergeResult = mergeSort(data, 0);
    console.log("Merge result:", mergeResult);

    console.log("\n--- QUICK SORT ---");
    console.log("Original array:", data);
    console.log("================================");

    const quickResult = quickSort(data, 0);
    console.log("Quick result:", quickResult);

    console.log("\nOriginal array after execution:", data);
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
    console.log(
        `${indent(depth)}merge ${JSON.stringify(left)} + ${JSON.stringify(right)}`
    );

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

    return [
        ...result,
        ...left.slice(i),
        ...right.slice(j)
    ];
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

    console.log(
        `${indent(depth)}left=${JSON.stringify(left)} right=${JSON.stringify(right)}`
    );

    const result = [
        ...quickSort(left, depth + 1),
        pivot,
        ...quickSort(right, depth + 1)
    ];

    console.log(`${indent(depth)}combined ->`, result);

    return result;
}

function indent(depth) {
    return "  ".repeat(depth);
}

function logSortCall(arr) {
    console.log(
        `A sorting function was called for array: ${JSON.stringify(arr)}`
    );
}

export default main;