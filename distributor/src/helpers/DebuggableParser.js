// Node imports
import fs from "fs";
import path from "path";

// Babel imports
import * as parser from "@babel/parser";

/**
 * Prints surrounding lines of code where the error happened.
 *
 * @param {string} code
 * @param {number} line
 * @param {number} radius
 */
function showErrorContext(code, line, radius = 3) {
    if (!line) return;

    const lines = code.split("\n");

    const start = Math.max(0, line - radius - 1);
    const end = Math.min(lines.length, line + radius);

    console.error("\n===== CODE CONTEXT =====\n");

    for (let i = start; i < end; i++) {
        const marker = (i + 1 === line) ? ">>" : "  ";

        console.error(
            `${marker} ${String(i + 1).padStart(4)} | ${lines[i]}`
        );
    }

    console.error("\n========================\n");
}

/**
 * Writes generated code that caused an error.
 *
 * @param {string} debugName
 * @param {string} code
 */
function dumpGeneratedCode(debugName, code) {
    const safeName = debugName
        ?.replace(/[^\w\d_-]/g, "_")
        || "generated";

    const fileName = `__babel_error_${safeName}.js`;
    const filePath = path.resolve(process.cwd(), fileName);

    fs.writeFileSync(filePath, code);

    return filePath;
}

/**
 * Safe wrapper around Babel parser.parse().
 *
 * Automatically dumps invalid generated code
 * and prints useful debugging information.
 *
 * @param {string} code
 * @param {object} options
 * @param {string} debugName
 * @returns {import("@babel/types").File}
 */
export function parse(code, options = {}, debugName = "generated") {
    try {
        return parser.parse(code, {
            sourceType: "module",
            ...options,
            sourceFilename:
                options.sourceFilename ||
                `${debugName}_generated.js`
        });
    } catch (err) {

        const dumpedFile = dumpGeneratedCode(debugName, code);

        console.error("\n=================================");
        console.error(" BABEL PARSER ERROR DETECTED ");
        console.error("=================================\n");

        console.error(`Generated file saved at:`);
        console.error(`→ ${dumpedFile}\n`);

        if (err.loc) {
            console.error(
                `Location: line ${err.loc.line}, column ${err.loc.column}`
            );

            showErrorContext(code, err.loc.line);
        }

        console.error("Original error:");
        console.error(err.message);
        console.error("\n=================================\n");

        throw err;
    }
}