async function getMessage(greeting, person) {
    const response = await fetch(`http://localhost:3000/getMessage?greeting=${greeting}&person=${person}`);
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
    const fullName = getFullName("John", "Doe");
    const greeting = "Hello";
    const message = await getMessage(greeting, fullName);
    console.log(message);
}
export default main;
export {
    getFullName as getFullName_localRef
};