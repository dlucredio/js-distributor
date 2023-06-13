import JavaScriptParserVisitor from '../antlr4/JavaScriptParserVisitor.js';
import { smartJoin } from './generator-utils.js';

export default class CopyPasteGenerator extends JavaScriptParserVisitor {
    visitBlock(ctx) {
        if (ctx === null) return '';
        return `{ ${super.visitBlock(ctx)} }`;
    }

    visitImportStatement(ctx) {
        if (ctx === null) return '';
        return `import ${this.visitImportFromBlock(ctx.importFromBlock())};`;
    }

    visitImportFromBlock(ctx) {
        if (ctx === null) return '';
        if (ctx.importFrom() !== null) {
            return `${this.visitImportDefault(ctx.importDefault())}
                ${this.visitImportNamespace(ctx.importNamespace())}
                ${this.visitImportModuleItems(ctx.importModuleItems())}
                ${this.visitImportFrom(ctx.importFrom())}
                ;`;
        } else {
            return `${ctx.StringLiteral()};`;
        }
    }

    visitImportModuleItems(ctx) {
        if (ctx === null) return '';
        const aliasNamesStr = ctx.importAliasName().map((an) => this.visitImportAliasName(an));
        return `{ ${smartJoin(aliasNamesStr,', ')} }`;
    }

    visitImportDefault(ctx) {
        if (ctx === null) return '';
        return `${this.visitAliasName(ctx.aliasName())}, `;
    }

    visitImportNamespace(ctx) {
        if (ctx === null) return '';
        if (ctx.getText().startsWith('*')) {
            let iName = '';
            if (ctx.identifierName().length > 0) {
                iName = ` as ${this.visitIdentifierName(ctx.identifierName()[0])}`;
            }
            return `*${iName}`;
        } else {
            let iName = '';
            if (ctx.identifierName().length > 1) {
                iName = ` as ${this.visitIdentifierName(ctx.identifierName()[1])}`;
            }
            return `${this.visitIdentifierName(ctx.identifierName()[0])}${iName}`;
        }
    }

    visitImportFrom(ctx) {
        if (ctx === null) return '';
        return ` from ${ctx.StringLiteral().getText()}`;
    }

    visitImportAliasName(ctx) {
        const id1 = this.visitIdentifierName(ctx.identifierName()[0]);
        let id2 = '';
        if (ctx.identifierName().length === 2) {
            id2 = ` as ${this.visitIdentifierName(ctx.identifierName()[1])}`;
        }
        return `${id1}${id2}`;
    }

    visitExportDeclaration(ctx) {
        if (ctx === null) return '';
        return `export
            ${this.visitExportFromBlock(ctx.exportFromBlock())}
            ${this.visitDeclaration(ctx.declaration())}
        ;`;
    }

    visitExportDefaultDeclaration(ctx) {
        if (ctx === null) return '';
        return `export default ${this.visitSingleExpression(ctx.singleExpression())};`;
    }

    visitExportFromBlock(ctx) {
        if (ctx === null) return '';
        return `exportFromBlock`;
    }

    visitDeclaration(ctx) {
        if (ctx == null) return '';
        return `dec`;
    }

    visitVariableDeclarationList(ctx) {
        if (ctx === null) return '';
        const variableDeclarationsStr = ctx.variableDeclaration().map((vd) => this.visitVariableDeclaration(vd));
        return `${this.visitVarModifier(ctx.varModifier())} ${smartJoin(variableDeclarationsStr, ', ')}`;
    }

    visitIdentifierName(ctx) {
        return ctx.getText();
    }

    visitVarModifier(ctx) {
        return ctx.getText();
    }

    visitVariableDeclaration(ctx) {
        return 'variableDeclaration';
    }

    visitSingleExpression(ctx) {
        return 'exp';
    }

    visitVariableDeclarationList(ctx) {
        console.log("passei:"+ctx.varModifier().getText());
        ctx.variableDeclaration().forEach(vd => {
            const a = vd.assignable();
            const id = a.identifier();
            console.log("O nome é "+id.getText());
        });
    }
}