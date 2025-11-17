// Babel imports
import traverse from "@babel/traverse";
const babelTraverse = traverse.default ?? traverse;
import * as t from "@babel/types";

export class TestRouteVisitor{
    constructor(serverInfo, relativePath, tree) {
        this.serverInfo = serverInfo;
        this.relativePath = relativePath;
        this.tree = tree;
        this.functionPatterns = [] // i need functionName -> parameters
        this.importPath = "#root/start.js";
        this.apiTestSuffix = "ApiTest";
        this.replacedFunctions = new Set();
        this.newRemoteFunctions;
        this.serverInfo.functions.forEach(element => {
            element.callPatterns.forEach(e => {
                this.functionPatterns.push({ [e] : element.method})
            })
        });
    }

    getNewRemotesFunctions(){
        return this.newRemoteFunctions;
    }

    
    isReplaceable(text){
        for(let i = 0; i< this.functionPatterns.length; i++){
            const [[key, ]] = Object.entries(this.functionPatterns[i]);
            if(text.includes(key)){
                return i
            }
        }
        return -1
    }


    replaceTestApiCall() {
        let state = {};
        
        const selfReference = this;

        babelTraverse(selfReference.tree, {
            Program: {
                enter(path) {
                    selfReference.onProgramEnter(path, state);
                },
                exit(path) {
                    selfReference.onProgramExit(path);
                }
            },
            CallExpression(path) { 
                selfReference.onCallExpression(path)
            }
            
        })

    }


    onProgramEnter(path, state) {
        state.importsFound = new Set();

        const importDecls = path.get("body").filter(p => p.isImportDeclaration());

        importDecls.forEach(imp => {
        imp.node.specifiers.forEach(spec => {
            if (!t.isImportSpecifier(spec)) return;

            const importedName = spec.imported.name;

            //Mapping  imports.
            if (this.isReplaceable(importedName)) {
            state.importsFound.add(importedName);
            }
        });
        });
    }


    onProgramExit(path) {
        if(this.replacedFunctions.length == 0) return
        
        const importNode = this.buildImport();
        this.buildNewRemoteFunctions();
        // Insert at the top
        path.unshiftContainer("body", importNode);
    }


    onCallExpression(path) {
        const callee = path.node.callee;

        if (!t.isIdentifier(callee)) return;

        const original = callee.name;
        const replaceIndex = this.isReplaceable(original);
        if (replaceIndex < 0) return;
        const newName  = Object.keys(this.functionPatterns[replaceIndex])[0].concat(this.apiTestSuffix);
        this.replacedFunctions.add(newName)

        // Replace f → fApiTest
        path.node.callee = t.identifier(newName);
    }

    buildImport() {
        const specifiers = [...this.replacedFunctions].map(fn =>
            t.importSpecifier(t.identifier(fn), t.identifier(fn))
        );

        return t.importDeclaration(
            specifiers,
            t.stringLiteral(this.importPath)
        );
    }

    buildNewRemoteFunctions(){
        const objects = []
        for(let i of this.replacedFunctions){
            const replaceIndex = this.isReplaceable(i.replace(this.apiTestSuffix, ""));
            const fInfo = Object.keys(this.functionPatterns[replaceIndex]);
            const remoteFunctions = {
                callPatterns: [i],
                serverInfo: this.serverInfo, 
                relativePath:this.relativePath,
                method: this.functionPatterns[replaceIndex][fInfo]
            }
            objects.push(remoteFunctions)
        }
        this.newRemoteFunctions = objects;
    }
}

// Problems: 
/*
    gerar funções locais get pro teste FEITO
    gerar fuções locais post pro teste  FEITO
        ~instalar dependencia supertest~
        ~importar supertest~ 
    trocar na mão chamada nos testes (TESTADO COM GET, OK), (TESTADO COM POST, OK)
        Precisei importar a função do start.js (problematico...?)
        adicionar async/await nos testes. (testar se fixAsync cobre esses casos)
    // no import trocar funcApiTest por funcApiTest as func ... start.js. Remover import de func...
*/