// ANTLR code imports
import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";

// Internal imports
import astHelpers from "../helpers/AstHelpers.js";

export class PrepareTreeVisitor extends JavaScriptParserVisitor {
    visitChildren(ctx) {
        const n = ctx.getChildCount();
        ctx.nodeId = astHelpers.NodeIdGenerator.getNextId();
        for (let i = 0; i < n; i++) {
            const child = ctx.getChild(i);
            if (child && typeof child === 'object' && 'accept' in child) {
                child.parent = ctx;
                child.accept(this);
            }
        }
        return null;
    }    
}