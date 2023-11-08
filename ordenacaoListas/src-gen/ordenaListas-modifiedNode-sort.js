function insertionSort(inputArr) {
    const response = fetch('http://sort:8080/insertionSort');
    const result = response.json();
    return result;
}