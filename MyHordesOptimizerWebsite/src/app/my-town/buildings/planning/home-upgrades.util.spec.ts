import { cascadeAp, cascadeLevels, homeTaskIndex, nextHomeTarget, reachableHomeLevels, upgradesAllowed } from './home-upgrades.util';
import { PlanTaskDTO } from './plan.types';

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

    describe('consigne de maison ajoutée par « + »', (): void => {
        const kitchen: PlanTaskDTO = { id: 'k', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 3 };
        const house: PlanTaskDTO = { id: 'h', kind: 'home', level: 2, pa: 4 };

        it('retrouve la consigne de l\'élément : habitation ou amélioration de même clé', (): void => {
            expect(homeTaskIndex([kitchen, house], null)).toBe(1);
            expect(homeTaskIndex([kitchen, house], 'kitchenLevel')).toBe(0);
            expect(homeTaskIndex([kitchen, house], 'laboLevel')).toBe(-1);
        });

        it('sans consigne : niveau suivant du citoyen ; avec : un niveau de plus que la consigne', (): void => {
            expect(nextHomeTarget([], 'kitchenLevel', 1, 4, false)).toBe(2);
            expect(nextHomeTarget([kitchen], 'kitchenLevel', 1, 4, false)).toBe(3);
            expect(nextHomeTarget([kitchen], 'kitchenLevel', 3, 4, false)).toBe(4);
        });

        it('niveau maximal atteint ou niveau inconnu : rien à ajouter', (): void => {
            expect(nextHomeTarget([], 'kitchenLevel', 4, 4, false)).toBeNull();
            expect(nextHomeTarget([{ ...kitchen, level: 4 }], 'kitchenLevel', 1, 4, false)).toBeNull();
            expect(nextHomeTarget([], null, null, 5, true)).toBeNull();
        });

        it('habitation : un seul agrandissement par jour, sauf en chaos ou en Pandémonium', (): void => {
            expect(nextHomeTarget([], null, 1, 5, false)).toBe(2);
            expect(nextHomeTarget([house], null, 1, 5, false)).toBeNull();
            expect(nextHomeTarget([house], null, 1, 5, true)).toBe(3);
        });
    });

    describe('upgradesAllowed', (): void => {
        it('habitation au niveau 1 ou plus : améliorations permises', (): void => {
            expect(upgradesAllowed([], 1)).toBe(true);
            expect(upgradesAllowed([], 3)).toBe(true);
        });

        it('habitation au niveau 0 ou inconnue : améliorations interdites', (): void => {
            expect(upgradesAllowed([], 0)).toBe(false);
            expect(upgradesAllowed([], null)).toBe(false);
        });

        it('agrandissement du jour au niveau 1 ou plus : améliorations permises', (): void => {
            expect(upgradesAllowed([{ id: 'h', kind: 'home', level: 1, pa: 2 }], 0)).toBe(true);
            expect(upgradesAllowed([{ id: 'h', kind: 'home', pa: 0 }], 0)).toBe(false);
        });
    });
});
