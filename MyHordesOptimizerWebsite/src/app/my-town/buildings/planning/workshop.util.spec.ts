import { freeThreshold, repairHpPerAp, roundHalfUp, workshopCap, workshopRatio } from './workshop.util';

describe('workshop.util', (): void => {
    it('workshopRatio suit la table du jeu', (): void => {
        expect(workshopRatio(0)).toBe(1);
        expect(workshopRatio(1)).toBeCloseTo(0.94, 10);
        expect(workshopRatio(2)).toBeCloseTo(0.88, 10);
        expect(workshopRatio(3)).toBeCloseTo(0.82, 10);
        expect(workshopRatio(4)).toBe(0.75);
        expect(workshopRatio(5)).toBe(0.65);
    });

    it('workshopRatio reste positif et fini pour un niveau hors table', (): void => {
        expect(workshopRatio(-2)).toBe(1);
        expect(workshopRatio(9)).toBeCloseTo(0.72, 10);
        expect(Number.isFinite(workshopRatio(Number.NaN))).toBe(true);
    });

    it('repairHpPerAp : 2 jusqu\'au niveau 3 puis +1 par niveau', (): void => {
        expect([0, 1, 2, 3, 4, 5].map((level: number): number => repairHpPerAp(level))).toEqual([2, 2, 2, 2, 3, 4]);
    });

    it('roundHalfUp arrondit la moitié vers le haut', (): void => {
        expect(roundHalfUp(20.5)).toBe(21);
        expect(roundHalfUp(20.49)).toBe(20);
        expect(roundHalfUp(0)).toBe(0);
    });

    it('workshopCap arrondit pa × ratio', (): void => {
        expect(workshopCap(50, 3)).toBe(41);
        expect(workshopCap(40, 4)).toBe(30);
        expect(workshopCap(25, 3)).toBe(21);
        expect(workshopCap(40, 0)).toBe(40);
    });

    it('freeThreshold : PA à laisser pour qu\'un vote d\'atelier termine le chantier', (): void => {
        expect(freeThreshold(40, 3)).toBe(3);
        expect(freeThreshold(40, 0)).toBe(2);
        expect(freeThreshold(1, 0)).toBe(0);
    });

    it('freeThreshold n\'est jamais négatif', (): void => {
        expect(freeThreshold(10, 5)).toBeGreaterThanOrEqual(0);
        expect(freeThreshold(0, 2)).toBe(0);
    });
});
