export function main() {
    console.log("Inside function main()");
    const text = "hello world!";
    console.log(`Initial text: ${text}`);
    const upperCaseText = toUpperCase(text);
    console.log(`Transformed text: ${upperCaseText}`);
    console.log("Done");
}

function toUpperCase(s) {
    console.log("Inside function toUpperCase()");
    console.log(`Parameter: ${s}`);
    return s.toUpperCase();
}