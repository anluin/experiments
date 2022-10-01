// `$comptime: <statement>` transforms to...
// nothing.
$comptime: {
    // but the content is passed to eval
    console.log("runs at comptime");
}

console.log("runs at runtime");
