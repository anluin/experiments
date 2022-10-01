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
