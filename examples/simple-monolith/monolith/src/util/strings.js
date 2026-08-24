// 1. Converts uppercase letters to lowercase manually
export function toLowerCase(str) {
    console.log("toLowerCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        // Uppercase letters: A-Z (65-90)
        if (code >= 65 && code <= 90) {
            result += String.fromCharCode(code + 32); // Convert to lowercase
        } else {
            result += str[i]; // Keep original character
        }
    }
    return result;
}

// 2. Converts lowercase letters to uppercase manually
export function toUpperCase(str) {
    console.log("toUpperCase(" + str + ")");
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        // Lowercase letters: a-z (97-122)
        if (code >= 97 && code <= 122) {
            result += String.fromCharCode(code - 32); // Convert to uppercase
        } else {
            result += str[i]; // Keep original character
        }
    }
    return result;
}

// 3. Splits a string into an array based on a separator
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
    result.push(temp); // Add the last segment
    return result;
}

export function mock_split(str, separator = ",") {
    return str.split(separator);
}



// 4. Joins an array into a string with a specified separator (default is comma)
export function join(arr, separator = ',') {
    split(arr, separator)
    console.log("join(" + arr + "," + separator + ")");
    let result = '';

    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
        if (i < arr.length - 1) {
            result += separator; // Add separator between elements
        }
    }
    return result;
}
