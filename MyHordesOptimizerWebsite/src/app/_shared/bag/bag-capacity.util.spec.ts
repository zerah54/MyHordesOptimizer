import { bagCapacity, bagOverflow, displayedBagCapacity, enduranceBonus, maxBagCapacity } from './bag-capacity.util';

describe('bag-capacity.util', (): void => {
    it('bonus Endurant par niveau MHO, inconnu = null', (): void => {
        expect([0, 1, 2, 3, 4].map(enduranceBonus)).toEqual([0, 1, 2, 2, 3]);
        expect(enduranceBonus(null)).toBeNull();
    });

    it('capacité : base, bonus Endurant, meilleure extension seule, ceinture', (): void => {
        expect(bagCapacity(0, [])).toBe(4);
        expect(bagCapacity(4, ['bag_#00'])).toBe(9);
        expect(bagCapacity(1, ['bag_#00', 'bagxl_#00', 'pocket_belt_#00'])).toBe(10);
        expect(bagCapacity(2, ['cart_#00'])).toBe(9);
        expect(bagCapacity(null, ['bag_#00'])).toBeNull();
    });

    it('capacité affichée : exacte si le niveau est connu, minimum d\'un habitant sinon', (): void => {
        expect(displayedBagCapacity(4, ['bag_#00'])).toBe(9);
        expect(displayedBagCapacity(null, ['bag_#00'])).toBe(6);
    });

    it('dépassement ; niveau inconnu comparé au bonus maximal', (): void => {
        expect(bagOverflow(null, [], 7)).toBe(false);
        expect(bagOverflow(null, [], 8)).toBe(true);
        expect(bagOverflow(0, [], 5)).toBe(true);
        expect(bagOverflow(0, [], 4)).toBe(false);
    });

    it('capacité maximale : exacte si le niveau est connu, bonus maximal sinon', (): void => {
        expect(maxBagCapacity(1, ['bag_#00'])).toBe(7);
        expect(maxBagCapacity(null, ['bag_#00'])).toBe(9);
    });
});
