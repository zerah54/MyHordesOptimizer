import { sanitizeItemsSortMode } from './items-sort-mode';

describe('sanitizeItemsSortMode', (): void => {
    it('garde un tri connu', (): void => {
        expect(sanitizeItemsSortMode('quantity')).toBe('quantity');
        expect(sanitizeItemsSortMode('category')).toBe('category');
    });

    it('revient au tri par catégorie pour une valeur absente ou inconnue', (): void => {
        expect(sanitizeItemsSortMode(null)).toBe('category');
        expect(sanitizeItemsSortMode('size')).toBe('category');
        expect(sanitizeItemsSortMode(1)).toBe('category');
    });
});
