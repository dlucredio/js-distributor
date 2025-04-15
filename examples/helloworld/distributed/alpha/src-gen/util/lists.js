function push(list, element) {
    console.log("Pushing ...");
    list.push(element);
}
export async function log(list) {
    const response = await fetch(`http://localhost:3001/log`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "list": list
        })
    });
    const {
        result
    } = await response.json();
    return result;
}
export default {
    push
};