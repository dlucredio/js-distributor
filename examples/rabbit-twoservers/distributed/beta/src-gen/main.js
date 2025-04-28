export async function main() {
    const response = await fetch(`http://localhost:3000/main`);
    const {
        result
    } = await response.json();
    return result;
}

function toUpperCase(s) {
    console.log("Inside function toUpperCase()");
    console.log(`Parameter: ${s}`);
    return s.toUpperCase();
}
export {
    toUpperCase as toUpperCase_localRef
};