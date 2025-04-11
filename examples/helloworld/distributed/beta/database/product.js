async function saveProduct(id, name = "") {
    const response = await fetch(`http://localhost:3002/saveProduct?id=${id}&name=${name}`);
    const {
        result
    } = await response.json();
    return result;
}