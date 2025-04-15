function push(list, element) {
    console.log("Pushing ...");
    list.push(element);
}
export function log(list) {
    console.log("Logging ...");
    console.log(`List has ${list.length} elements: ${list.join(",")}`);
}
export default {
    push
};
export {
    log as log_localRef
};