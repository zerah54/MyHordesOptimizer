import { buildShareUrl, decodeSnapshot, encodeSnapshot, toBoundedNumber, TOOL_SNAPSHOT_PARAM } from './tool-snapshot.util';

describe('tool-snapshot.util', (): void => {

    describe('encodeSnapshot / decodeSnapshot', (): void => {
        it('restitue le snapshot à l\'identique, accents compris', (): void => {
            const snapshot: object = { v: 1, title: 'Équipe à l\'œuvre', chances: [10, 55.5, 100] };

            expect(decodeSnapshot(encodeSnapshot(snapshot))).toEqual(snapshot);
        });

        it('produit une chaîne sûre dans une URL (ni +, ni /, ni =)', (): void => {
            const encoded: string = encodeSnapshot({ a: '>>>???xy' });

            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
            expect(decodeSnapshot(encoded)).toEqual({ a: '>>>???xy' });
        });

        it('renvoie null pour une chaîne vide', (): void => {
            expect(decodeSnapshot('')).toBeNull();
        });

        it('renvoie null pour une chaîne qui n\'est pas du base64', (): void => {
            expect(decodeSnapshot('%%%')).toBeNull();
        });

        it('renvoie null pour du base64 qui ne contient pas du JSON', (): void => {
            expect(decodeSnapshot('bm90IGpzb24')).toBeNull();
        });

        it('renvoie null pour du JSON qui n\'est pas un objet', (): void => {
            expect(decodeSnapshot('NDI')).toBeNull();
            expect(decodeSnapshot('WzFd')).toBeNull();
            expect(decodeSnapshot('bnVsbA')).toBeNull();
        });
    });

    describe('buildShareUrl', (): void => {
        it('ajoute le snapshot dans le paramètre partagé de l\'URL de la page', (): void => {
            const url: URL = new URL(buildShareUrl('https://exemple.fr/tools/overflow', { v: 1 }));

            expect(url.pathname).toBe('/tools/overflow');
            expect(decodeSnapshot(url.searchParams.get(TOOL_SNAPSHOT_PARAM) ?? '')).toEqual({ v: 1 });
        });

        it('remplace un snapshot déjà présent et conserve les autres paramètres, sans le fragment', (): void => {
            const url: URL = new URL(buildShareUrl(`https://exemple.fr/tools/overflow?autre=1&${TOOL_SNAPSHOT_PARAM}=ancien#haut`, { v: 2 }));

            expect(url.searchParams.get('autre')).toBe('1');
            expect(url.searchParams.getAll(TOOL_SNAPSHOT_PARAM).length).toBe(1);
            expect(decodeSnapshot(url.searchParams.get(TOOL_SNAPSHOT_PARAM) ?? '')).toEqual({ v: 2 });
            expect(url.hash).toBe('');
        });
    });

    describe('toBoundedNumber', (): void => {
        it('garde une valeur comprise dans les bornes', (): void => {
            expect(toBoundedNumber(42, 0, 100, 7)).toBe(42);
        });

        it('ramène une valeur hors bornes à la borne la plus proche', (): void => {
            expect(toBoundedNumber(-5, 0, 100, 7)).toBe(0);
            expect(toBoundedNumber(1e9, 0, 100, 7)).toBe(100);
        });

        it('renvoie le repli pour toute valeur qui n\'est pas un nombre fini', (): void => {
            expect(toBoundedNumber('12', 0, 100, 7)).toBe(7);
            expect(toBoundedNumber(NaN, 0, 100, 7)).toBe(7);
            expect(toBoundedNumber(Infinity, 0, 100, 7)).toBe(7);
            expect(toBoundedNumber(null, 0, 100, 7)).toBe(7);
            expect(toBoundedNumber(undefined, 0, 100, 7)).toBe(7);
        });
    });
});
