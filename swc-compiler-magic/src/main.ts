import { dirname } from "https://deno.land/std@0.152.0/path/mod.ts";

import { ReactivityPlugin } from "./plugins/reactivity.ts";

import { ComptimePlugin } from "./plugins/comptime.ts";
import { compile } from "./compiler.ts";


const [ sourceFilePath, distFilePath ] = Deno.args;
const distDirectoryPath = dirname(distFilePath);

const source = await Deno.readTextFile(sourceFilePath);
const dist = await compile(source, [ ComptimePlugin, ReactivityPlugin ]);

await Deno.mkdir(distDirectoryPath, { recursive: true })
await Deno.writeTextFile(distFilePath, dist);
