import { trashLevel } from './trash-level.pipe';

describe('trashLevel', (): void => {
    it('suit les paliers du nombre d\'objets', (): void => {
        expect([0, 1, 4, 5, 8, 9].map((value: number): number => trashLevel(value, 'nb'))).toEqual([0, 1, 1, 2, 2, 3]);
    });

    it('suit des paliers propres à la défense apportée', (): void => {
        expect([0, 1, 8, 9, 16, 17].map((value: number): number => trashLevel(value, 'def'))).toEqual([0, 1, 1, 2, 2, 3]);
    });
});
