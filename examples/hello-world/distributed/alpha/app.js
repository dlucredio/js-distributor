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
async function getFullName(firstName, lastName) {
    const response = await fetch(`http://localhost:3001/getFullName`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "firstName": firstName,
            "lastName": lastName
        })
    });
    const {
        executionResult
    } = await response.json();
    return executionResult;
}
async function main() {
    console.log("Running application");
    const fullName = await getFullName("John", "Doe");
    const greeting = "Hello";
    const message = await getMessage(greeting, fullName);
    console.log(message);
}
export default main;