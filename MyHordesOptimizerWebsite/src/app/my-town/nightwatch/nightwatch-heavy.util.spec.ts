import { Item } from '../../_abstract_model/types/item.class';
import { heavySlotsLeft, isHeavy } from './nightwatch-heavy.util';

describe('nightwatch-heavy.util', (): void => {
    const catalog: Item[] = [
        Object.assign(new Item(), { id: 1, is_heaver: true }),
        Object.assign(new Item(), { id: 2, is_heaver: false })
    ];

    it('un seul encombrant, deux pour le Gardien', (): void => {
        expect(heavySlotsLeft({}, catalog, false)).toBe(1);
        expect(heavySlotsLeft({ 1: 1, 2: 5 }, catalog, false)).toBe(0);
        expect(heavySlotsLeft({ 1: 1 }, catalog, true)).toBe(1);
        expect(heavySlotsLeft({ 1: 3 }, catalog, true)).toBe(-1);
    });

    it('objet inconnu du catalogue : non encombrant', (): void => {
        expect(isHeavy(catalog, 99)).toBe(false);
        expect(isHeavy(catalog, 1)).toBe(true);
    });
});
