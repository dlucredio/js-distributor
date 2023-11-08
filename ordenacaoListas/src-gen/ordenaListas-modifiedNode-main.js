function main() {
    const response = fetch('http://main:3000/main');
    const result = response.json();
    return result;
}