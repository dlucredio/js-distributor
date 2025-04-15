export async function saveCustomer(name, address, age, email, number, ssn) {
    const response = await fetch(`http://alpha:3000/saveCustomer?name=${name}&address=${address}&age=${age}&email=${email}&number=${number}&ssn=${ssn}`);
    const {
        result
    } = await response.json();
    return result;
}