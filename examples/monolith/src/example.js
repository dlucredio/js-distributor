function isAEqualToB(a, b) {
    const subResult = sub(a, b);

    if (subResult === 0) return true;
    else return false;
}

function sub(a, b) {
    return a - b;
}