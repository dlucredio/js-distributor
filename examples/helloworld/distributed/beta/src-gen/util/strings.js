export function toLowerCase(str) {
    console.log("toLowerCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (code >= 65 && code <= 90) {
            result += String.fromCharCode(code + 32);
        } else {
            result += str[i];
        }
    }
    return result;
}
export function toUpperCase(str) {
    console.log("toUpperCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (code >= 97 && code <= 122) {
            result += String.fromCharCode(code - 32);
        } else {
            result += str[i];
        }
    }
    return result;
}
export function split(str, separator = ",") {
    console.log("split(" + str + "," + separator + ")");
    let result = [];
    let temp = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] === separator) {
            result.push(temp);
            temp = '';
        } else {
            temp += str[i];
        }
    }
    result.push(temp);
    return result;
}
export function join(arr, separator = ',') {
    console.log("join(" + arr + "," + separator + ")");
    let result = '';
    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
        if (i < arr.length - 1) {
            result += separator;
        }
    }
    return result;
}
export {
    split as split_localRef, join as join_localRef
};