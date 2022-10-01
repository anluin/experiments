import { Module } from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.d.ts";

import { transform } from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.js";

import { patch, Plugin, walk } from "../compiler.ts";


export class ComptimePlugin extends Plugin {
    process(module: Module) {
        walk(module, node => {
            if (node.type === "LabeledStatement") {
                if (node.label.value === "$comptime") {
                    const module: Module = {
                        type: "Module",
                        interpreter: null as unknown as string,
                        body: [
                            node.body,
                        ],
                        span: {
                            start: 1,
                            end: 0,
                            ctxt: 0,
                        },
                    };

                    transform(module, {
                        minify: true,
                        jsc: {
                            target: "es2022",
                        },
                    })
                        .then(({ code }) => eval(code))
                        .catch(console.error);

                    patch(node, { type: "EmptyStatement", span: node.span });

                    return false;
                }
            }

            return true;
        });
    }
}
