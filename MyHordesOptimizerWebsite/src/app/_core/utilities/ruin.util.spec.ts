import { getBuriedRuinCapacity } from './ruin.util';

describe('ruin.util', (): void => {
    it('getBuriedRuinCapacity gives one place per 3 remaining digs', (): void => {
        expect(getBuriedRuinCapacity(2)).toBe(0);
        expect(getBuriedRuinCapacity(3)).toBe(1);
        expect(getBuriedRuinCapacity(7)).toBe(2);
    });

    it('getBuriedRuinCapacity is capped at 3 places', (): void => {
        expect(getBuriedRuinCapacity(9)).toBe(3);
        expect(getBuriedRuinCapacity(42)).toBe(3);
    });

    it('getBuriedRuinCapacity gives no place for an empty, negative or invalid dig count', (): void => {
        expect(getBuriedRuinCapacity(0)).toBe(0);
        expect(getBuriedRuinCapacity(-4)).toBe(0);
        expect(getBuriedRuinCapacity(Number.NaN)).toBe(0);
    });
});
