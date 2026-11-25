import { plannableDays } from './plannable-days';

describe('plannableDays', (): void => {
    it('va d\'aujourd\'hui à J50 tant que la ville n\'a pas dépassé J40', (): void => {
        const days: number[] = plannableDays(17, []);

        expect(days[0]).toBe(17);
        expect(days[days.length - 1]).toBe(50);
        expect(days.length).toBe(34);
    });

    it('propose 10 jours après aujourd\'hui au-delà de J40', (): void => {
        const days: number[] = plannableDays(45, []);

        expect(days[0]).toBe(45);
        expect(days[days.length - 1]).toBe(55);
    });

    it('ajoute les jours ayant une proposition, triés et sans doublon', (): void => {
        expect(plannableDays(48, [3, 49, 60])).toEqual([3, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60]);
    });
});
