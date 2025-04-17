let currentId = 1;

const NodeIdGenerator = {
    getNextId() {
        return currentId++;
    },
    reset() {
        currentId = 1;
    }
};

export default {
    NodeIdGenerator
}