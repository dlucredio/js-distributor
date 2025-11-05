export async function saveCustomer(name, address, age, email, number, ssn) {
    await Promise.resolve();
    console.log(`Saving customer: ${name}, ${address}, ${age}, ${email}, ${number}, ${ssn}`);
    return {
        name: name,
        address: address,
        age: age,
        email: email,
        number: number,
        ssn: ssn
    };
}