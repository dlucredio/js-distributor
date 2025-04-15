export async function saveProduct(id, name = "") {
    const response = await fetch(`http://alpha:3000/saveProduct?id=${id}&name=${name}`);
    const {
        result
    } = await response.json();
    return result;
}