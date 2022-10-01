# SWC Compiler Magic
While experimenting with Deno & SWC I made a simple compiler based on SWC that loads "plugins" to transform the AST.

## Comptime
The first AST-Transformation-Plugin traverses through the AST,
replaces `$comptime: <statement>` nodes with `<EmptyStatement>` and
transforms the removed node to es2022 to evaluate it with `eval`.
```ts
// `$comptime: <statement>` transforms to...
// nothing.
$comptime: {
    // but the content is passed to eval
    console.log("runs at comptime");
}

console.log("runs at runtime");
```


## Reactivity
The second AST-Transformation-Plugin also goes through the AST,
collects information and transforms the AST in a way to archive a Svelte-like reactivity:
```ts
// Variables used in effects that are reassigned elsewhere are transformed:
// `let <identifier> = <initializer>` transforms to
// `let <identifier> = new Signal(<initializer>)`
let name: string | undefined = undefined;

setTimeout(() => {
    // Assignments of variables used in effects are transformed:
    // `<identifier> = <expression>` transforms to
    // `<identifier>.update(<expression>)`
    name = "Anluin";
}, 1000);


// `$:<statement>` transforms to
// `effect(() => <statement>)`
$: {
    // Variables used in effects are transformed:
    // `<identifier>` transforms to
    // `<identifier>.unwrap()`
    console.log(name);
}
```
