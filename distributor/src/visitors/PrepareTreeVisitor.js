// ANTLR code imports
import JavaScriptParserVisitor from "../antlr4/JavaScriptParserVisitor.js";

// Internal imports
import astHelpers from "../helpers/AstHelpers.js";

export class PrepareTreeVisitor extends JavaScriptParserVisitor {
    constructor(){
        super();
        this.mappedMockFunctions = new Array()
    }

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

    visitIdentifier(ctx) {
        const functionDeclarationContextRuleIndex = [19, 44];

        const parentRuleIndex = ctx.parent.ruleIndex;
        if (functionDeclarationContextRuleIndex.includes(parentRuleIndex)) {
            const functionName = ctx.getText();
            if(functionName.startsWith("mock") && !this.mappedMockFunctions.includes(functionName.replace("mock_",""))){
                this.mappedMockFunctions.push(functionName.replace("mock_",""))
            }
        }

        return super.visitIdentifier(ctx);
    }

    getMappedMockFunctions(){
        return this.mappedMockFunctions;
    }

}