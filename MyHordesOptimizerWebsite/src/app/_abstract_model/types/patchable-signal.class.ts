import { CreateSignalOptions, signal, Signal, WritableSignal } from '@angular/core';
import { SIGNAL, SignalGetter, SignalNode, signalUpdateFn } from '@angular/core/primitives/signals';

export type PatchableSignal<T extends object> = Signal<T> & WritableSignal<T> &
    {
        /** Updates properties on an object */
        patch(value: Partial<T>): void;
    };

export function patchableSignal<T extends object>(initialValue: T, options?: CreateSignalOptions<T>): PatchableSignal<T> {
    const internal: SignalGetter<T> & WritableSignal<T> = signal<T>(initialValue, options) as SignalGetter<T> & WritableSignal<T>;
    const node: SignalNode<T> = internal[SIGNAL];
    return Object.assign(internal, {
        patch: (value: Partial<T>) => signalUpdateFn(node, (x: T) => ({ ...x, ...value })),
    });
}
