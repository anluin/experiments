import { Expression, Module, Output, parse, transform } from "./lib/swc/mod.ts";
import {
    createArrayExpression,
    createCallExpression,
    createIdentifier,
    createImportDeclaration,
    createImportSpecifier,
    createStringLiteral,
    patch,
    walk,
    WalkableNode
} from "./lib/swc/helper.ts";

import { dirname, join, relative } from "https://deno.land/std@0.152.0/path/mod.ts";


class Tano {
    private modules: Record<string, Module> = {};

    async load(workspace: string, name: string) {
        const path = join(workspace, name);

        name = `/${relative(workspace, path)}`;

        console.debug("load", path);

        try {
            const code = await Deno.readTextFile(path);

            const module = await parse(code, {
                syntax: "typescript",
                target: "es2019",
                comments: true,
                tsx: true,
            });

            for (const item of module.body) {
                switch (item.type) {
                    case "ImportDeclaration": {
                        const source = relative(workspace, join(dirname(path), item.source.value));

                        await this.load(workspace, source);

                        patch(item.source, createStringLiteral(
                            item.source.value.replace(/\.tsx?$/m, ".js"),
                            item.source.value.replace(/\.tsx?$/m, ".js"),
                            item.source.span,
                        ));

                        break;
                    }
                    case "ExpressionStatement":
                    case "TsModuleDeclaration":
                    case "ExportDeclaration":
                    case "VariableDeclaration":
                    case "ExportDefaultExpression":
                        break;
                    default:
                        throw new Error(`can not understand ${item.type}`);
                }
            }

            const transformJSX = (node: WalkableNode): Expression | undefined => {
                switch (node.type) {
                    case "JSXExpressionContainer":
                        transform(node.expression);

                        return createCallExpression(
                            createIdentifier("normalize", false, node.span),
                            [
                                node.expression,
                            ], node.span);
                    case "JSXText": {
                        const content = node.value.trim();

                        if (content.length === 0) {
                            return undefined;
                        }

                        return createArrayExpression([
                            createIdentifier("textSymbol", false, node.span),
                            createStringLiteral(content, node.raw, node.span),
                        ], node.span);
                    }
                    case "JSXElement": {
                        if (node.opening.name.type !== "Identifier") {
                            throw new Error();
                        }

                        const tagName = node.opening.name.value;

                        if (tagName[0].toUpperCase() === tagName[0]) {
                            return createArrayExpression([
                                createIdentifier("componentSymbol", false, node.span),
                                createArrayExpression(node.children.map(transformJSX)),
                                node.opening.name,
                            ], node.span);
                        } else {
                            return createArrayExpression([
                                createIdentifier("tagSymbol", false, node.span),
                                createArrayExpression(node.children.map(transformJSX)),
                                createStringLiteral(tagName, tagName, node.span),
                            ], node.span);
                        }
                    }
                    case "JSXFragment": {
                        return createArrayExpression([
                            createIdentifier("fragmentSymbol", false, node.span),
                            createArrayExpression(node.children.map(transformJSX)),
                        ], node.span);
                    }
                    default:
                        throw new Error(`can not transform ${node.type}`);
                }
            };

            let injectFrameworkImport = false;

            const transform = (node: WalkableNode) =>
                walk(node, node => {
                    switch (node.type) {
                        case "JSXElement":
                        case "JSXFragment":
                            injectFrameworkImport = true;
                            patch(node, transformJSX(node)!);

                            return false;
                        default:
                            return true;
                    }
                });

            transform(module);

            if (injectFrameworkImport) {
                await this.load(workspace, "framework.ts");

                module.body.splice(0, 0, (
                    createImportDeclaration(
                        [
                            createImportSpecifier(createIdentifier("textSymbol")),
                            createImportSpecifier(createIdentifier("tagSymbol")),
                            createImportSpecifier(createIdentifier("fragmentSymbol")),
                            createImportSpecifier(createIdentifier("componentSymbol")),
                            createImportSpecifier(createIdentifier("normalize")),
                        ],
                        createStringLiteral("/framework.js"),
                    )
                ));
            }

            this.modules[name] = module;
        } catch (error) {
            console.error(error);
        }
    }

    async bundle() {
        const bundle: Record<string, Output> = {};

        for (const path in this.modules) {
            const module = this.modules[path];

            bundle[path] = await transform(module, {
                minify: true,
                sourceMaps: true,
                sourceFileName: path,
                filename: path.replace(/\.tsx?$/m, "js"),
                jsc: {
                    minify: {
                        mangle: true,
                    },
                    target: "es2022",
                    parser: {
                        syntax: "typescript",
                    },
                },
            });
        }

        return bundle;
    }
}


const tano = new Tano();

await tano.load("tano-swc/example", "/frontend/index.tsx");

const output = await tano.bundle();


const cache: Record<string, () => Response> = {};

for (const path in output) {
    const { code, map } = output[path];

    cache[path.replace(/\.tsx?$/m, ".js")] = () => new Response(`${code}//# sourceMappingURL=${path.replace(/\.tsx?$/m, ".js")}.map`, {
        headers: {
            "Content-Type": "text/javascript; charset=utf-8",
        },
    });

    cache[`${path.replace(/\.tsx?$/m, ".js")}.map`] = () => new Response(map, {
        headers: {
            "Content-Type": "text/json; charset=utf-8",
        },
    });
}

const favicon = await Deno.readFile("tano-swc/example/resources/favicon.ico");

const createResponse = (request: Request): Response => {
    const url = new URL(request.url);

    switch (url.pathname) {
        case "/": {
            const body = `
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <title>Test</title>
                    </head>
                    <body>
                        <script src="/frontend/index.js" type="module"></script>
                    </body>
                </html>
            `;

            return new Response(body, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                },
            });
        }
        case "/favicon.ico": {
            return new Response(favicon, {
                headers: {
                    "Content-Type": "image/x-icon",
                }
            });
        }
        default: {
            const response = cache[url.pathname];

            if (response) {
                return response();
            }

            return new Response("404 | Not found!", {
                status: 404,
            });
        }
    }
};

const handleConnection = async (connection: Deno.Conn) => {
    for await (const { request, respondWith } of Deno.serveHttp(connection)) {
        const response = createResponse(request);

        respondWith(response)
            .catch(console.error);
    }
};

console.log("http://localhost:4500");

for await (const connection of Deno.listen({ port: 4500 })) {
    handleConnection(connection)
        .catch(console.error);
}
