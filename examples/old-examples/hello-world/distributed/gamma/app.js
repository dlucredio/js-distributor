async function getMessage(greeting, person) {
    const response = await fetch(`http://localhost:3000/getMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "greeting": greeting,
            "person": person
        })
    });
    const {
        executionResult
    } = await response.json();
    return executionResult;
}

function getFullName(firstName, lastName) {
    console.log("Getting full name");
    return firstName + " " + lastName;
}
async function main() {
    console.log("Running application");
    const fullName = getFullName("Fulano", "Silva");
    const greeting = "Hello";
    const message = await getMessage(greeting, fullName);
    console.log(message);
}
export default main;
export {
    getFullName as getFullName_localRef
};