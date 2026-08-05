import { describe, expect, it } from 'vitest';

import { calculateDespairDeaths } from './misc';

describe('calculateDespairDeaths', () => {
    it('returns 0 when no zombies were killed', () => {
        expect(calculateDespairDeaths(0)).toBe(0);
    });

    it('returns 0 when only one zombie was killed', () => {
        expect(calculateDespairDeaths(1)).toBe(0);
    });

    it('rounds down to the nearest whole zombie', () => {
        expect(calculateDespairDeaths(4)).toBe(1);
        expect(calculateDespairDeaths(5)).toBe(2);
    });
});
