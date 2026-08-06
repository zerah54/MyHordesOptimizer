import { describe, expect, it } from 'vitest';

import { getCitizenLocationSortKey, isCitizenLocationOutside } from './citizen-location';

describe('isCitizenLocationOutside', () => {
    it('returns false when the citizen is inside the town', () => {
        expect(isCitizenLocationOutside('--')).toBe(false);
    });

    it('returns true for real coordinates', () => {
        expect(isCitizenLocationOutside('[3,4]')).toBe(true);
    });

    it('returns true at the town gate', () => {
        expect(isCitizenLocationOutside('[0,0]')).toBe(true);
    });

    it('returns true during chaos/devastated state, where the game shows "Oui" instead of coordinates', () => {
        expect(isCitizenLocationOutside('Oui')).toBe(true);
    });
});

describe('getCitizenLocationSortKey', () => {
    it('sorts a citizen inside the town first, with dist 0', () => {
        expect(getCitizenLocationSortKey('--')).toEqual({ inTown: true, dist: 0 });
    });

    it('computes the Manhattan distance for real coordinates', () => {
        expect(getCitizenLocationSortKey('[3,4]')).toEqual({ inTown: false, dist: 7 });
    });

    it('computes a distance of 0 at the town gate', () => {
        expect(getCitizenLocationSortKey('[0,0]')).toEqual({ inTown: false, dist: 0 });
    });

    it('falls back to an unknown (infinite) distance during chaos/devastated state', () => {
        expect(getCitizenLocationSortKey('Oui')).toEqual({ inTown: false, dist: Infinity });
    });
});