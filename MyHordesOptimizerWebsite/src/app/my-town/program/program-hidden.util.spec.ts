import { hiddenKey, isHidden, setHidden } from './program-hidden.util';

function memoryStorage(): Storage {
    const store: Map<string, string> = new Map<string, string>();
    return <Storage><unknown>{
        getItem: vi.fn((key: string): string | null => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string): void => {
            store.set(key, value);
        }),
        removeItem: vi.fn((key: string): void => {
            store.delete(key);
        }),
    };
}

function throwingStorage(): Storage {
    const fail: () => never = (): never => {
        throw new Error('storage denied');
    };
    return <Storage><unknown>{ getItem: fail, setItem: fail, removeItem: fail };
}

describe('program-hidden.util', (): void => {
    it('construit une clé par ville, jour et bloc', (): void => {
        expect(hiddenKey(12, 5, 'expedition')).toBe('mho-program-hidden-12-5-expedition');
    });

    it('mémorise puis oublie le masquage', (): void => {
        const storage: Storage = memoryStorage();
        const key: string = hiddenKey(12, 5, 'buildings');

        setHidden(storage, key, true);
        expect(isHidden(storage, key)).toBe(true);

        setHidden(storage, key, false);
        expect(isHidden(storage, key)).toBe(false);
    });

    it('affiche tout si le stockage lève une exception', (): void => {
        const storage: Storage = throwingStorage();
        const key: string = hiddenKey(12, 5, 'expedition');

        expect(isHidden(storage, key)).toBe(false);
        expect((): void => setHidden(storage, key, true)).not.toThrow();
    });

    it('affiche tout sans stockage', (): void => {
        expect(isHidden(null, hiddenKey(12, 5, 'expedition'))).toBe(false);
    });
});
