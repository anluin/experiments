declare global {
    const React: unknown;

    namespace JSX {
        type IntrinsicElements = {
            html: {
                lang: string,
            },
            head: unknown,
            title: unknown,
            body: unknown,
            pre: unknown,
        };

        type Text = [ typeof textSymbol, string ];
        type Tag = [ typeof tagSymbol, Element[], keyof IntrinsicElements ];
        type Component = [ typeof componentSymbol, Element[], () => Element ];
        type Fragment = [ typeof fragmentSymbol, Element[] ];
        type Element = Text | Tag | Fragment | Component;
    }
}

export const textSymbol = Symbol();
export const tagSymbol = Symbol();
export const componentSymbol = Symbol();
export const fragmentSymbol = Symbol();


const inflate = ([ type, contentOrChildren, optionalTagNameOrRenderFn ]: JSX.Element): Node =>
    type === textSymbol
        ? document.createTextNode(contentOrChildren)
        : (node => (
            node.append(...contentOrChildren.map(inflate)) as undefined ||
            node
        ))(
            optionalTagNameOrRenderFn instanceof Function
                ? inflate(optionalTagNameOrRenderFn()) as ParentNode
                : optionalTagNameOrRenderFn
                    ? document.createElement(optionalTagNameOrRenderFn)
                    : document.createDocumentFragment()
        );

export const normalize = (value: unknown): JSX.Element => {
    if (value instanceof Array && [textSymbol, tagSymbol, componentSymbol, fragmentSymbol].includes(value[0])) {
        return value as JSX.Element;
    }

    throw new Error();
};

export const render = (element: JSX.Element) =>
    document.documentElement.replaceWith(inflate(element));
