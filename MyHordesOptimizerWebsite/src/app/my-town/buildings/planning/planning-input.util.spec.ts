import { toInt, toNonNegativeInt } from './planning-input.util';

describe('planning-input.util', (): void => {
    it('toNonNegativeInt : entier ≥ 0, 0 pour toute valeur invalide', (): void => {
        expect(toNonNegativeInt('12')).toBe(12);
        expect(toNonNegativeInt(12.7)).toBe(12);
        expect(toNonNegativeInt(-3)).toBe(0);
        expect(toNonNegativeInt('abc')).toBe(0);
        expect(toNonNegativeInt(null)).toBe(0);
        expect(toNonNegativeInt(undefined)).toBe(0);
        expect(toNonNegativeInt(Number.POSITIVE_INFINITY)).toBe(0);
        expect(toNonNegativeInt('')).toBe(0);
    });

    it('toInt : entier relatif, 0 pour toute valeur invalide', (): void => {
        expect(toInt('-4')).toBe(-4);
        expect(toInt(3.9)).toBe(3);
        expect(toInt(-3.9)).toBe(-3);
        expect(toInt('x')).toBe(0);
        expect(toInt(null)).toBe(0);
    });
});
