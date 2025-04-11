import fs from 'fs';
import path from 'path';

export class StringBuilder {
    constructor() {
        this.strings = [];
    }

    clear() {
        this.strings = [];
    }

    append(value) {
        if (value) {
            this.strings.push(value);
        }
    }

    appendNewLine() {
        this.strings.push('\n');
    }

    toString() {
        return this.strings.join("");
    }
}

export function smartJoin(list, separator) {
    let joined = list.map((s) => s.trim()).join(separator);
    if (joined.endsWith(separator)) {
        joined = joined.slice(0, -separator.length);
    }
    return joined;
}

export function flattenGeneratedCode(genCode) {
    const flatArray = genCode.flat(Infinity);
    let ret = "";
    flatArray.forEach((s) => (ret += s));
    return ret;
}

export function getAllJSFiles(dirPath, fileList = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const isDirectory = fs.statSync(filePath).isDirectory();

        if (isDirectory) {
            getAllJSFiles(filePath, fileList);
        } else {
            if (path.extname(filePath) === '.js') {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

export function createFoldersIfNecessary(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
}