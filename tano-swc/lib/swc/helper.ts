import {
    ArrayExpression,
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
    JSXClosingElement,
    JSXOpeningElement,
    MemberExpression,
    NewExpression,
    Node,
    ObjectExpression,
    Pattern,
    PrivateName,
    Statement,
    StringLiteral,
    Super,
} from "./wasm-web.d.ts";
import { JSXElementChild, Module, ModuleItem } from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.d.ts";

export type WalkableNode =
    Module
    | ModuleItem
    | Expression
    | Super
    | Import
    | ComputedPropName
    | JSXElementChild
    | Pattern
    | JSXOpeningElement
    | JSXClosingElement;

export const Span = (start = 1, end = 0, ctxt = 0) =>
    ({ start, end, ctxt });

export const createExpressionStatement = (expression: Expression, span = Span()): ExpressionStatement =>
    ({ type: "ExpressionStatement", span, expression });

export const createArrayExpression = (elements: (Expression | undefined)[], span = Span()): ArrayExpression =>
    ({ type: "ArrayExpression", elements: elements.filter(expression => !!expression).map(expression => expression && ({ expression })), span });

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

export const patch = <T extends Node, P extends Node>(target: T, patch: P) => {
    for (const key in target) {
        if (key in patch) {
            continue;
        }

        delete target[key];
    }

    Object.assign(target, patch);
};

export const walk = (node: WalkableNode, callback: (node: WalkableNode) => boolean) => {
    if (callback(node)) {
        switch (node.type) {
            case "Module":
                for (const child of node.body) {
                    walk(child, callback);
                }

                break;
            case "FunctionExpression":
            case "ArrowFunctionExpression":
                node.body && walk(node.body, callback);

                break;
            case "MemberExpression":
                walk(node.object, callback);
                walk(node.property, callback);

                break;
            case "ReturnStatement":
                if (node.argument) {
                    walk(node.argument, callback);
                }

                break;
            case "ArrayExpression":
                for (const child of node.elements) {
                    child && walk(child.expression, callback);
                }
                break;
            case "NewExpression":
            case "CallExpression":
                walk(node.callee, callback);

                for (const child of node?.arguments ?? []) {
                    walk(child.expression, callback);
                }

                break;
            case "BlockStatement":
                for (const child of node.stmts) {
                    walk(child, callback);
                }

                break;
            case "JSXElement":
                walk(node.opening, callback);

                if (node.closing) {
                    walk(node.closing, callback);
                }

            case "JSXFragment":
                for (const child of node.children) {
                    walk(child, callback);
                }

                break;
            case "LabeledStatement":
                walk(node.body, callback);

                break;
            case "BinaryExpression":
            case "AssignmentExpression":
                walk(node.left, callback);
                walk(node.right, callback);
                break;
            case "ParenthesisExpression":
            case "Computed":
            case "ExportDefaultExpression":
            case "ExpressionStatement":
                walk(node.expression, callback);

                break;
            case "VariableDeclaration":
                for (const child of node.declarations) {
                    child.init && walk(child.init, callback);
                }

                break;
            case "IfStatement":
                walk(node.test, callback);

                if (node.alternate) {
                    walk(node.alternate, callback);
                }

                break;
            case "SequenceExpression":
                for (const expression of node.expressions) {
                    walk(expression, callback);
                }
                break;
            case "ConditionalExpression":
                walk(node.test, callback);
                walk(node.alternate, callback);
                walk(node.consequent, callback);
                break;
            case "TsAsExpression":
            case "ExportDeclaration":
            case "JSXOpeningElement":
            case "JSXClosingElement":
            case "SwitchStatement":
            case "JSXText":
            case "ClassDeclaration":
            case "UnaryExpression":
            case "StringLiteral":
            case "NumericLiteral":
            case "NullLiteral":
            case "TsModuleDeclaration":
            case "EmptyStatement":
            case "Identifier":
            case "ImportDeclaration":
            case "TsTypeAliasDeclaration":
                break;
            default:
                throw new Error(`unknown node: ${node.type}`);
        }
    }
};
