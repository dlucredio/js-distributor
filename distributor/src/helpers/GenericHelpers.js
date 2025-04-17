function isIterable(obj) {
    return obj != null && typeof obj[Symbol.iterator] === 'function';
}

function isFunctionAndReturnsValue(obj, context) {
    if (typeof obj === 'function') {
        const result = obj.call(context);
        return result !== undefined;
    }
    return false;
}


export default {
    isIterable, isFunctionAndReturnsValue
}