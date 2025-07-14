function getMessage(greeting, person) {
    console.log("Getting message");
    return greeting + ", " + person + "!";
}

function getFullName(firstName, lastName) {
    console.log("Getting full name");
    return firstName + " " + lastName;
}

function main() {
    console.log("Running application");
    const fullName = getFullName("Fulano", "Silva");
    const greeting = "Hello";
    const message = getMessage(greeting, fullName);
    console.log(message);
}

export default main;