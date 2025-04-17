// External imports
import antlr4 from "antlr4";

// ANTLR code imports
import JavaScriptLexer from "../antlr4/JavaScriptLexer.js";
import JavaScriptParser from "../antlr4/JavaScriptParser.js";

// Internal imports
import astHelpers from "../helpers/AstHelpers.js";

function generateCompleteTree(content) {
    const parser = generateParserForString(content);
    return parser.program();
}

function replaceFunctionBody(ctx, newBody) {
    const parser = generateParserForString(newBody);
    const newBodyNode = parser.functionBody();
    newBodyNode.nodeId = astHelpers.NodeIdGenerator.getNextId();
    replaceNode(ctx.functionBody(), newBodyNode);
}

function addExportStatementNode(ctx, exportStatement) {
    const parser = generateParserForString(exportStatement);
    const exportStatementNode = parser.exportStatement();

    // ctx.sourceElements() is never null in this scenario, because
    // if we are adding an export statement, this means there is
    // at least one function declaration in this tree
    appendChildNode(ctx.sourceElements(), exportStatementNode);
}

function addImportStatementNode(ctx, importStatement) {
    const parser = generateParserForString(importStatement);
    const importStatementNode = parser.importStatement();

    // ctx.sourceElements() is never null in this scenario, because
    // if we are adding an import statement, this means there is
    // at least one function declaration in this tree
    appendChildNode(ctx.sourceElements(), importStatementNode, false);
}


function addAsyncIfNecessary(ctx) {
    if(ctx.Async()) {
        return false;
    }
    ctx.Async = () => 'async';
    return true;
}

function addAwaitToFunctionCallIfNecessary(argumentsExpressionContext) {
    // We are in an ArgumentsExpressionContext
    // Let's check our parent. If is an AwaitExpressionContext, nothing
    // needs to be done.
    // Otherwise, we must add an await

    if (argumentsExpressionContext.parent.constructor.name === "AwaitExpressionContext") {
        return null;
    }

    const oldCode = argumentsExpressionContext.getText();
    const newCode = "await "+oldCode;
    const parser = generateParserForString(newCode);
    const newNode = parser.singleExpression();
    newNode.nodeId = astHelpers.NodeIdGenerator.getNextId();
    replaceNode(argumentsExpressionContext, newNode);
    return newNode;
}

function replaceNode(oldNode, newNode) {
    const parent = oldNode.parent;

    if (!parent || !parent.children) {
        throw new Error("Old node has no parent or children to replace.");
    }

    const index = parent.children.findIndex(child => child.nodeId === oldNode.nodeId);
    if (index === -1) {
        throw new Error("Old node not found in parent's children.");
    }

    parent.children[index] = newNode;
    newNode.parent = parent;
}

function appendChildNode(parentNode, newNode, end = true) {
    if (!parentNode || !parentNode.children) {
        throw new Error("Parent node is invalid or has no children array.");
    }

    newNode.parent = parentNode;
    if(end) {
        parentNode.children.push(newNode);
    } else {
        parentNode.children.unshift(newNode);
    }
}

function generateParserForString(text) {
    const chars = new antlr4.InputStream(text);
    const lexer = new JavaScriptLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new JavaScriptParser(tokens);
    parser.buildParseTrees = true;
    return parser;
}

export default {
    addAsyncIfNecessary,
    addAwaitToFunctionCallIfNecessary,
    replaceFunctionBody,
    generateCompleteTree,
    addExportStatementNode,
    addImportStatementNode
}
