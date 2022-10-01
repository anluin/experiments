import {
    AssignmentExpression,
    Expression,
    Module,
    Node,
    Statement,
    VariableDeclarator
} from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.d.ts";

import {
    createArrowFunction,
    createBlockStatement,
    createCallExpression,
    createExpressionStatement,
    createIdentifier,
    createImportDeclaration,
    createImportSpecifier,
    createMemberExpression,
    createNewExpression,
    createStringLiteral
} from "../helper.ts";

import { patch, Plugin, walk } from "../compiler.ts";


const createEffectStatement = (statement: Statement): Statement =>
    createExpressionStatement(
        createCallExpression(
            createIdentifier("effect"),
            [
                createArrowFunction(
                    [],
                    createBlockStatement([
                        statement,
                    ]),
                ),
            ],
        )
    );

export class ReactivityPlugin extends Plugin {
    process(module: Module) {
        const variableDeclarations = new Map<string, {
            declarator: VariableDeclarator,
            assignments: AssignmentExpression[],
            uses: Expression[],
            usedInEffect: boolean,
        }>();

        walk(module, node => {
            switch (node.type) {
                case "Identifier": {
                    const variableDeclaration = variableDeclarations.get(node.value);

                    if (variableDeclaration) {
                        variableDeclaration.uses.push(node);
                    }

                    return true;
                }
                case "VariableDeclaration": {
                    for (const declaration of node.declarations) {
                        const identifier = declaration.id;

                        if (identifier.type === "Identifier") {
                            variableDeclarations.set(identifier.value, {
                                declarator: declaration,
                                uses: [],
                                assignments: [],
                                usedInEffect: false,
                            });
                        }
                    }

                    return true;
                }
                case "AssignmentExpression": {
                    if (node.left.type === "Identifier") {
                        const variableDeclaration = variableDeclarations.get(node.left.value);

                        if (variableDeclaration) {
                            variableDeclaration.assignments.push(node);
                        }
                    }

                    return true;
                }
                case "LabeledStatement": {
                    if (node.label.value === "$") {
                        walk(node.body, node => {
                            if (node.type === "Identifier") {
                                const variableDeclaration = variableDeclarations.get(node.value);

                                if (variableDeclaration) {
                                    variableDeclaration.usedInEffect = true;
                                    variableDeclaration.uses.push(node);
                                }
                            }

                            return true;
                        });

                        patch(node, createEffectStatement(node.body));

                        return false;
                    }

                    return true;
                }
                default:
                    return true;
            }
        });

        let shouldInjectSignalImportDeclaration = false;

        for (const [ _, { usedInEffect, assignments, declarator, uses } ] of variableDeclarations) {
            if (usedInEffect) {
                const patches: [ Node, Node ][] = [];

                let isMutable = false;

                for (const usage of uses) {
                    const expression = { ...usage };

                    if (assignments.findIndex(assignment => assignment.left === usage) !== -1) {
                        isMutable = true;
                        continue;
                    }

                    patches.push([ usage, createCallExpression({
                        "type": "MemberExpression",
                        "span": {
                            "start": 388,
                            "end": 399,
                            "ctxt": 0
                        },
                        "object": expression,
                        "property": createIdentifier("unwrap"),
                    }, []) ])
                }

                for (const assignment of assignments) {
                    patches.push([ assignment,
                        createCallExpression(
                            createMemberExpression(
                                assignment.left as Expression,
                                createIdentifier("update"),
                            ),
                            [
                                assignment.right,
                            ],
                        ) ]);
                }

                if (isMutable) {
                    shouldInjectSignalImportDeclaration = true;

                    declarator.init = createNewExpression(
                        createIdentifier("Signal"),
                        declarator.init
                            ? [ declarator.init ]
                            : [],
                    );

                    for (const [ previous, next ] of patches) {
                        patch(previous, next);
                    }
                }
            }
        }

        if (shouldInjectSignalImportDeclaration) {
            module.body.splice(0, 0, (
                createImportDeclaration(
                    [
                        createImportSpecifier(
                            createIdentifier("Signal"),
                        ),
                        createImportSpecifier(
                            createIdentifier("effect"),
                        ),
                    ],
                    createStringLiteral("../src/signal.ts"),
                )
            ));
        }
    }
}
