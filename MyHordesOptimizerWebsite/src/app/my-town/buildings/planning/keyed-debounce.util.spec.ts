import { KeyedDebounce } from './keyed-debounce.util';

describe('KeyedDebounce', (): void => {
    beforeEach((): void => {
        vi.useFakeTimers();
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('n\'exécute que la dernière action d\'une même clé après le délai', (): void => {
        const debounce: KeyedDebounce = new KeyedDebounce(400);
        const calls: number[] = [];

        debounce.schedule('a', (): void => void calls.push(1));
        vi.advanceTimersByTime(300);
        debounce.schedule('a', (): void => void calls.push(2));
        vi.advanceTimersByTime(399);
        expect(calls).toEqual([]);
        vi.advanceTimersByTime(1);

        expect(calls).toEqual([2]);
    });

    it('des clés différentes ne s\'annulent pas', (): void => {
        const debounce: KeyedDebounce = new KeyedDebounce(400);
        const calls: string[] = [];

        debounce.schedule('a', (): void => void calls.push('a'));
        debounce.schedule('b', (): void => void calls.push('b'));
        vi.advanceTimersByTime(400);

        expect(calls.sort()).toEqual(['a', 'b']);
    });

    it('cancelAll annule les actions en attente', (): void => {
        const debounce: KeyedDebounce = new KeyedDebounce(400);
        const calls: number[] = [];

        debounce.schedule('a', (): void => void calls.push(1));
        debounce.cancelAll();
        vi.advanceTimersByTime(1000);

        expect(calls).toEqual([]);
    });

    it('flush exécute immédiatement les actions en attente', (): void => {
        const debounce: KeyedDebounce = new KeyedDebounce(400);
        const calls: number[] = [];

        debounce.schedule('a', (): void => void calls.push(1));
        debounce.flush();
        vi.advanceTimersByTime(1000);

        expect(calls).toEqual([1]);
    });
});
