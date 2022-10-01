export class Signal<T> {
    private readonly callbacks: Set<() => void>;
    private value: T;

    constructor(value: T) {
        this.value = value;
        this.callbacks = new Set();
    }

    update(value: T) {
        if (this.value !== value) {
            const callbacks = [ ...this.callbacks ];

            this.value = value;
            this.callbacks.clear();

            for (const callback of callbacks) {
                callback();
            }
        }

        return this.value;
    }

    unwrap() {
        if (currentEffectCallback) {
            this.callbacks.add(currentEffectCallback);
        }

        return this.value;
    }
}

let currentEffectCallback: (() => void) | undefined;

export const effect = (callback: () => void) => {
    const previousCallback = currentEffectCallback;

    // debounce
    (currentEffectCallback = ((timeoutId = -1) => () => {
        timeoutId !== -1 && clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            timeoutId = -1;
            callback();
        });
    })())

    callback();
    currentEffectCallback = previousCallback;
};
