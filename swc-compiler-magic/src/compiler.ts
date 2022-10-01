import type {
    ComputedPropName,
    Expression,
    Import,
    JSXElementChild,
    Module,
    ModuleItem,
    Node,
    Pattern,
    Super
} from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.d.ts";

import init, { parse, transform } from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.js";

import { toFileUrl } from "https://deno.land/std@0.152.0/path/mod.ts";

import { cache } from "https://deno.land/x/cache@0.2.13/mod.ts";

export type WalkableNode =
    Module
    | ModuleItem
    | Expression
    | Super
    | Import
    | ComputedPropName
    | JSXElementChild
    | Pattern;

export abstract class Plugin {
    abstract process(module: Module): void;
}

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
            case "ClassDeclaration":
            case "UnaryExpression":
            case "StringLiteral":
            case "NumericLiteral":
            case "NullLiteral":
            case "TsModuleDeclaration":
            case "EmptyStatement":
            case "Identifier":
            case "ImportDeclaration":
                break;
            default:
                throw new Error(`unknown node: ${node.type}`);
        }
    }
};

export const compile = async (source: string, plugins: (typeof Plugin)[]): Promise<string> => {
    const module: Module = await parse(source, {
        target: "es2022",
        syntax: "typescript",
        comments: false,
        tsx: true,
    })

    for (const Plugin of plugins) {
        // @ts-ignore: given plugin-classes are not abstract...
        const plugin = new Plugin();
        plugin.process(module);
    }

    const { code } = await transform(module, {
        jsc: {
            target: "es2022",
            parser: {
                syntax: "typescript",
            },
        },
    });

    return code;
};

await cache("https://esm.sh/@swc/wasm-web@1.3.2/wasm-web_bg.wasm")
    .then(({ path }) => init(toFileUrl(path)));
