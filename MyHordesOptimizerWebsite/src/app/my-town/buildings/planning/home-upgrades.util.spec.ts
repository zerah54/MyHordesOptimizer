import { cascadeAp, cascadeLevels, reachableHomeLevels } from './home-upgrades.util';

describe('home-upgrades.util', (): void => {
    describe('cascadeLevels', (): void => {
        it('tous les niveaux entre le niveau actuel (exclu) et le niveau visé (inclus)', (): void => {
            expect(cascadeLevels(0, 4)).toEqual([1, 2, 3, 4]);
            expect(cascadeLevels(2, 3)).toEqual([3]);
        });

        it('niveau actuel inconnu : seulement le niveau visé', (): void => {
            expect(cascadeLevels(null, 3)).toEqual([3]);
        });

        it('niveau déjà atteint : rien à payer', (): void => {
            expect(cascadeLevels(4, 4)).toEqual([]);
            expect(cascadeLevels(5, 2)).toEqual([]);
        });
    });

    describe('cascadeAp', (): void => {
        it('additionne les PA de chaque niveau à payer', (): void => {
            const ap: Map<number, number> = new Map<number, number>([[1, 6], [2, 6], [3, 8], [4, 6]]);
            expect(cascadeAp((level: number): number => ap.get(level) ?? 0, 0, 4)).toBe(26);
            expect(cascadeAp((level: number): number => ap.get(level) ?? 0, null, 4)).toBe(6);
        });
    });

    describe('reachableHomeLevels', (): void => {
        const LEVELS: number[] = [1, 2, 3, 4, 5];

        it('hors chaos et Pandémonium : seulement le niveau suivant', (): void => {
            expect(reachableHomeLevels(LEVELS, 2, false)).toEqual([3]);
        });

        it('en chaos ou Pandémonium : tous les niveaux au-dessus du niveau actuel', (): void => {
            expect(reachableHomeLevels(LEVELS, 2, true)).toEqual([3, 4, 5]);
        });

        it('niveau actuel inconnu : tous les niveaux', (): void => {
            expect(reachableHomeLevels(LEVELS, null, false)).toEqual(LEVELS);
        });

        it('niveau maximal atteint : aucun', (): void => {
            expect(reachableHomeLevels(LEVELS, 5, false)).toEqual([]);
        });
    });
});
