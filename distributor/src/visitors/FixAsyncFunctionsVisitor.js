// Babel imports
import traverse from "@babel/traverse";
const babelTraverse = traverse.default ?? traverse;
import * as t from "@babel/types";

// Internal imports
import config from '../config/Configuration.js';


export class FixAsyncFunctionsVisitor {
    constructor(serverInfo, relativePath, babelAsync, allBabelRemoteFunctionsInServer) {
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.babelAsync = babelAsync;
        this.allBabelRemoteFunctionsInServer = allBabelRemoteFunctionsInServer;
        
    }

    babelWrapperVisitCallExpression(babelTree){
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
}