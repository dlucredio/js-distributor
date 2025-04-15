export async function saveCustomer(name, address, age, email, number, ssn) {
    await Promise.resolve();
    console.log(`Saving customer: ${name}, ${address}, ${age}, ${email}, ${number}, ${ssn}`);
}
export {
    saveCustomer as saveCustomer_localRef
};