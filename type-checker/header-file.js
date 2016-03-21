'use strict';

var assert = require('assert');
var TypedError = require('error/typed');

var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');

var UnknownLiteralError = TypedError({
    type: 'jsig.header-file.unknown-literal',
    message: 'Could not resolve {literal}',
    literal: null
});

module.exports = HeaderFile;

function HeaderFile(jsigAst) {
    this.rawJsigAst = jsigAst;
    this.resolvedJsigAst = null;

    this.indexTable = Object.create(null);
    this.errors = [];
    this.astReplacer = new JsigASTReplacer(this);
}

HeaderFile.prototype.replace = function replace(ast, rawAst) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, rawAst);
    } else if (ast.type === 'import') {
        return this.replaceImport(ast, rawAst);
    } else {
        assert(false, 'unexpected ast.type: ' + ast.type);
    }
};

HeaderFile.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, rawAst) {
    var name = ast.name;
    var typeDefn = this.indexTable[name];
    if (!typeDefn) {
        this.errors.push(UnknownLiteralError({
            literal: name
        }));
    } else {
        typeDefn._raw = rawAst;
    }

    return typeDefn;
};

HeaderFile.prototype.replaceImport =
function replaceImport(ast, rawAst) {
    // Find another HeaderFile instance for filePath
    // Then reach into indexTable and grab tokens
    // Copy tokens into local index table
};

HeaderFile.prototype.addToken =
function addToken(token, defn) {
    assert(!this.indexTable[token], 'cannot double add token');
    this.indexTable[token] = defn;
};

HeaderFile.prototype.resolveReferences =
function resolveReferences() {
    if (this.resolvedJsigAst) {
        return;
    }

    var ast = this.rawJsigAst;
    var copyAst = JSON.parse(JSON.stringify(ast));

    for (var i = 0; i < copyAst.statements.length; i++) {
        var line = copyAst.statements[i];

        if (line.type === 'typeDeclaration') {
            this.addToken(line.identifier, line.typeExpression);
        }
    }

    copyAst = this.astReplacer.inlineReferences(copyAst, ast);

    this.resolvedJsigAst = copyAst;
};

HeaderFile.prototype.getResolvedAssignments =
function getResolvedAssignments() {
    this.resolveReferences();

    if (!this.resolvedJsigAst) {
        return null;
    }

    return this.resolvedJsigAst.statements;
};
