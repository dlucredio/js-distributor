import { v4 as uuidv4 } from 'uuid';

export function generateKey(prefix) {
    console.log(`Generating key with prefix '${prefix}'`);
    const key = prefix + ":" + uuidv4();
    return key;
}
