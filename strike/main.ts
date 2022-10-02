type PointerType = {
    kind: "pointer",
    type: Type,
}

type TypeType = {
    kind: "type",
}

type NothingType = {
    kind: "nothing",
}

type InferType = {
    kind: "infer",
}

type IntegerType = {
    kind: "integer",
    num_bits: number,
}

type FunctionType = {
    kind: "function",
    parameters: Type[],
    return_type: Type,
};

type Type = FunctionType | IntegerType | PointerType | TypeType | InferType | NothingType;

type FnBuiltin = {
    kind: "builtin",
    type: FunctionType,
};

type FnExtern = {
    kind: "extern",
    type: FunctionType,
};

type Fn = FnBuiltin | FnExtern;

type FunctionValue = {
    kind: "function",
    fn: Fn;
};

type StringValue = {
    kind: "string",
    payload: string,
};

type IntegerValue = {
    kind: "integer",
    payload: number,
};

type Value = StringValue | IntegerValue | FunctionValue;

type PushInstruction = {
    kind: "push",
    value: Value,
};

type LoadInstruction = {
    kind: "load",
    identifier: string,
};

type CallInstruction = {
    kind: "call",
    num_arguments: number,
};

type DropInstruction = {
    kind: "drop",
};

type Instruction =
    PushInstruction |
    LoadInstruction |
    CallInstruction |
    DropInstruction;

type Procedure = {
    instructions: Instruction[],
}

type Variable = {
    identifier: string,
    initializer?: Procedure,
}

type Program = {
    variables: Variable[],
    initializer?: Procedure,
}

const Program = (variables: Variable[], initializer?: Procedure): Program =>
    ({ variables, initializer });

const Variable = (identifier: string, initializer?: Procedure): Variable =>
    ({ identifier, initializer });

const Procedure = (instructions: Instruction[]): Procedure =>
    ({ instructions });

const StringValue = (payload: string): StringValue =>
    ({ kind: "string", payload })

const IntegerValue = (payload: number): IntegerValue =>
    ({ kind: "integer", payload })

const FunctionValue = (fn: Fn): FunctionValue =>
    ({ kind: "function", fn })

const Push = (value: Value): PushInstruction =>
    ({ kind: "push", value })

const Load = (identifier: string): LoadInstruction =>
    ({ kind: "load", identifier })

const Call = (num_arguments: number): CallInstruction =>
    ({ kind: "call", num_arguments })

const Drop = (): DropInstruction =>
    ({ kind: "drop" })

const FnBuiltin = (type: FunctionType): FnBuiltin =>
    ({ kind: "builtin", type })

const FunctionType = (parameters: Type[], return_type: Type): FunctionType =>
    ({ kind: "function", parameters, return_type })

const TypeType = (): TypeType =>
    ({ kind: "type" })
const NothingType = (): NothingType =>
    ({ kind: "nothing" })

const InferType = (): InferType =>
    ({ kind: "infer" })

const IntegerType = (num_bits: number): IntegerType =>
    ({ kind: "integer", num_bits })

const program = Program(
    [
        Variable("Parameter", Procedure([
            Push(FunctionValue(FnBuiltin(FunctionType([
                TypeType(),
            ], NothingType()))))
        ])),
        Variable("Prototype", Procedure([
            Push(FunctionValue(FnBuiltin(FunctionType([
                TypeType(),
            ], TypeType()))))
        ])),
        Variable("Integer", Procedure([
            Push(FunctionValue(FnBuiltin(FunctionType([
                IntegerType(32),
            ], TypeType()))))
        ])),
        Variable("Pointer", Procedure([
            Push(FunctionValue(FnBuiltin(FunctionType([
                TypeType(),
            ], TypeType()))))
        ])),
        Variable("extern", Procedure([
            Push(FunctionValue(FnBuiltin(FunctionType([
                TypeType(),
            ], InferType()))))
        ])),
        Variable("Int32", Procedure([
            Push(IntegerValue(32)),
            Load("Integer"),
            Call(1),
        ])),
        Variable("Int8", Procedure([
            Push(IntegerValue(8)),
            Load("Integer"),
            Call(1),
        ])),
        Variable("Int8Ptr", Procedure([
            Load("Integer"),
            Load("Pointer"),
            Call(1),
        ])),
        Variable("Puts", Procedure([
            Load("Int"),
            Load("Parameter"),
            Call(1),
            Load("Int"),
            Load("Prototype"),
            Call(1),
        ])),
        Variable("puts", Procedure([
            Load("Puts"),
            Load("extern"),
            Call(1),
        ])),
    ],
    Procedure([
        Push(StringValue("Hello, world!")),
        Load("puts"),
        Call(1),
        Drop(),
    ]),
);



console.dir(program, { depth: Infinity });
