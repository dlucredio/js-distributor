// ANTLR code imports
import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";

// Babel imports
import traverse from "@babel/traverse";
const babelTraverse = traverse.default ?? traverse;
import * as t from "@babel/types";

// Internal imports
import config from '../config/Configuration.js';
import helpers from '../helpers/GenericHelpers.js';
import ast from '../transformations/ASTModifications.js';

export class FixAsyncFunctionsVisitor extends JavaScriptParserVisitor {
    constructor(serverInfo, relativePath, functionsToFixAsync, newAsyncFunctions, babelTree, babelAsync, allBabelRemoteFunctionsInServer) {
        super();
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.functionsToFixAsync = functionsToFixAsync;
        this.newAsyncFunctions = newAsyncFunctions;
        this.babelTree = babelTree;
        this.babelAsync = babelAsync;
        this.allBabelRemoteFunctionsInServer = allBabelRemoteFunctionsInServer;
        babelTraverse(babelTree, {
            CallExpression: (path) => this.visitCallExpression(path)
        });
    }
    visitCallExpression(path) {
        const callee = path.node.callee;

        // get the string version of call: e.g., foo(), obj.bar(), etc.
        const callText = this.getCallText(callee);

        for (const ftfa of this.allBabelRemoteFunctionsInServer) {
            if (config.matchCallPattern(callText, ftfa.callPatterns)) {
                this.addAwaitIfNecessaryBabel(path);
            }
        }
    }

  getCallText(callee) {
    if (t.isIdentifier(callee)) return callee.name;
    if (t.isMemberExpression(callee)) {
      return `${this.getCallText(callee.object)}.${this.getCallText(callee.property)}`;
    }
    return "<unknown>";
  }

  addAwaitIfNecessaryBabel(path) {
    // If the parent is already awaiting this call, skip
    if (t.isAwaitExpression(path.parent)) return;

    const awaitExpr = t.awaitExpression(path.node);
    path.replaceWith(awaitExpr);

    // Now propagate: mark declaring function as async
    this.markDeclaringFunctionAsync(path);
  }

  markDeclaringFunctionAsync(path) {
        const fnPath = path.findParent((p) =>
            p.isFunctionDeclaration() ||
            p.isFunctionExpression() ||
            p.isArrowFunctionExpression()
        );

        if (!fnPath) {
            console.warn(`Warning: Could not find declaring function for ${path.toString()} in ${this.relativePath}`);
            return;
        }

        const fnNode = fnPath.node;
        if (!fnNode.async) {
            fnNode.async = true;

            // If this was a named function, we can propagate
            if (t.isFunctionDeclaration(fnNode) && fnNode.id) {
                this.babelAsync.push({
                    callPatterns: [fnNode.id.name],
                    serverInfo: this.serverInfo,
                    relativePath: this.relativePath
                });
            }
        }
    }

    addAwaitIfNecessary(singleExpressionCtx) {
        if (!singleExpressionCtx) {
            return;
        }
        if (helpers.isIterable(singleExpressionCtx)) {
            for (const ctx of singleExpressionCtx) {
                this.addAwaitIfNecessary(ctx);
            }
            return;
        }
        const nodeWithArgs = this.findNodeWithArgsAndNoNew(singleExpressionCtx);
        if (!nodeWithArgs) {
            return;
        }
        const callStatement = nodeWithArgs.singleExpression().getText();
        for (const ftfa of this.functionsToFixAsync) {
            if (config.matchCallPattern(callStatement, ftfa.callPatterns)) {
                const newNodeWithAwait = ast.addAwaitToFunctionCallIfNecessary(nodeWithArgs);
                if (newNodeWithAwait) {
                    const declaringFunction = this.findDeclaringFunction(newNodeWithAwait);
                    if (!declaringFunction) {
                        // Maybe this is a top-level statement. Not necessarily a problem
                        // Let's issue a warning:
                        console.log(`Warning. Could not find declaring function for statement ${newNodeWithAwait.getText()} in server ${this.serverInfo.id} / ${this.relativePath}`);
                    } else {
                        const added = ast.addAsyncIfNecessary(declaringFunction);
                        if (added && declaringFunction.constructor.name === "FunctionDeclarationContext") {
                            this.newAsyncFunctions.push({
                                callPatterns: [declaringFunction.identifier().getText()],
                                serverInfo: this.serverInfo,
                                relativePath: this.relativePath
                            });
                        }
                    }
                }
            }
        }
    }

    findNodeWithArgsAndNoNew(ctx) {
        if (helpers.isFunctionAndReturnsValue(ctx.arguments, ctx) && !helpers.isFunctionAndReturnsValue(ctx.New, ctx)) {
            return ctx;
        }
        const childCount = ctx.getChildCount();
        for (let i = 0; i < childCount; i++) {
            const ret = this.findNodeWithArgsAndNoNew(ctx.getChild(i));
            if (ret) {
                return ret;
            }
        }
        return null;
    }

    findDeclaringFunction(ctx) {
        let currentNode = ctx;
        while (currentNode) {
            if (currentNode.constructor.name === "FunctionDeclarationContext") {
                return currentNode;
            } else if(currentNode.constructor.name === "ArrowFunctionContext") {
                return currentNode;
            }
            currentNode = currentNode.parent;
        }
        return null;
    }

    visitExpressionSequence(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitExpressionSequence(ctx);
    }

    visitExportDefaultDeclaration(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitExportDefaultDeclaration(ctx);
    }

    visitVariableDeclaration(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitVariableDeclaration(ctx);
    }

    visitForInStatement(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitForInStatement(ctx);
    }

    visitForOfStatement(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitForOfStatement(ctx);
    }

    visitClassTail(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitClassTail(ctx);
    }

    visitClassElement(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitClassElement(ctx);
    }

    visitFormalParameterArg(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitFormalParameterArg(ctx);
    }

    visitLastFormalParameterArg(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitLastFormalParameterArg(ctx);
    }

    visitArrayElement(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitArrayElement(ctx);
    }

    visitPropertyAssignment(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitPropertyAssignment(ctx);
    }

    visitPropertyName(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitPropertyName(ctx);
    }

    visitArgument(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitArgument(ctx);
    }

    visitArrowFunctionBody(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitArrowFunctionBody(ctx);
    }

    visitTemplateStringAtom(ctx) {
        this.addAwaitIfNecessary(ctx.singleExpression());
        super.visitTemplateStringAtom(ctx);
    }

}