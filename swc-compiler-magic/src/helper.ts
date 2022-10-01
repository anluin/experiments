import {
    ArrowFunctionExpression,
    BlockStatement,
    CallExpression,
    ComputedPropName,
    Expression,
    ExpressionStatement,
    Identifier,
    Import,
    ImportDeclaration,
    ImportSpecifier,
    MemberExpression,
    NewExpression, ObjectExpression,
    Pattern,
    PrivateName,
    Statement,
    StringLiteral,
    Super
} from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.d.ts";


export const Span = (start = 1, end = 0, ctxt = 0) =>
    ({ start, end, ctxt });

export const createExpressionStatement = (expression: Expression, span = Span()): ExpressionStatement =>
    ({ type: "ExpressionStatement", span, expression });

export const createIdentifier = (value: string, optional = false, span = Span()): Identifier =>
    ({ type: "Identifier", span, value, optional });

export const createCallExpression = (callee: Super | Import | Expression, args: Expression[], span = Span()): CallExpression =>
    ({ type: "CallExpression", span, callee, arguments: args.map(expression => ({ expression })) });

export const createNewExpression = (callee: Expression, args: Expression[], span = Span()): NewExpression =>
    ({ type: "NewExpression", span, callee, arguments: args.map(expression => ({ expression })) });

export const createArrowFunction = (params: Pattern[], body: Expression | BlockStatement, async = false, generator = false, span = Span()): ArrowFunctionExpression =>
    ({ type: "ArrowFunctionExpression", span, params, body, async, generator })

export const createBlockStatement = (stmts: Statement[], span = Span()): BlockStatement =>
    ({ type: "BlockStatement", span, stmts });

export const createMemberExpression = (object: Expression, property: Identifier | PrivateName | ComputedPropName, span = Span()): MemberExpression =>
    ({ type: "MemberExpression", object, property, span });

export const createStringLiteral = (value: string, raw = JSON.stringify(value), span = Span()): StringLiteral =>
    ({ type: "StringLiteral", value, raw, span });

export const createImportSpecifier = (local: Identifier, imported?: Identifier | StringLiteral, isTypeOnly = false, span = Span()): ImportSpecifier =>
    ({ type: "ImportSpecifier", local, span, imported, isTypeOnly });

export const createImportDeclaration = (specifiers: ImportSpecifier[], source: StringLiteral, asserts?: ObjectExpression, typeOnly = false, span = Span()): ImportDeclaration =>
    ({ type: "ImportDeclaration", specifiers, span, source, asserts, typeOnly });
