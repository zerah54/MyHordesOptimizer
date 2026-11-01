import { Category } from '../../_abstract_model/types/category.class';
import { Item } from '../../_abstract_model/types/item.class';
import { itemsByQuantity } from './items-by-quantity.pipe';

function category(ordering: number): Category {
    return Object.assign(new Category(), { id_category: ordering, ordering });
}

function item(id: number, label: string, item_category: Category): Item {
    return Object.assign(new Item(), { id, label: { fr: label }, category: item_category });
}

describe('itemsByQuantity', (): void => {
    const food: Category = category(0);
    const resources: Category = category(1);

    it('classe les objets présents du plus nombreux au moins nombreux, à égalité par libellé, puis les absents par catégorie', (): void => {
        const items: Item[] = [item(1, 'Pomme', food), item(2, 'Poire', food), item(3, 'Bois', resources), item(4, 'Ail', food), item(5, 'Fer', resources), item(6, 'Abricot', food)];
        const counts: ReadonlyMap<number, number> = new Map<number, number>([[3, 2], [2, 7], [6, 2], [5, 0]]);

        expect(itemsByQuantity(items, counts, 'fr').map((sorted: Item): number => sorted.id)).toEqual([2, 6, 3, 4, 1, 5]);
    });

    it('ne réordonne pas la liste reçue', (): void => {
        const items: Item[] = [item(1, 'Pomme', food), item(2, 'Poire', food)];

        itemsByQuantity(items, new Map<number, number>([[2, 1]]), 'fr');

        expect(items.map((kept: Item): number => kept.id)).toEqual([1, 2]);
    });
});
