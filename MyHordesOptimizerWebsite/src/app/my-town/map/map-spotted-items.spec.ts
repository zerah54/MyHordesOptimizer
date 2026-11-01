import { Cell } from '../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';
import { cellSpottedItems, itemCountsOnMap, NO_SPOTTED_ITEMS, sanitizeSpottedItemUids, spottedItemsFirst, spottedItemsSummary, spottedQuantity } from './map-spotted-items';

function itemCount(item_id: number, count: number, is_broken: boolean = false): ItemCountShort {
    const item: ItemCountShort = new ItemCountShort();
    item.item_id = item_id;
    item.count = count;
    item.is_broken = is_broken;
    return item;
}

function cellWith(...items: ItemCountShort[]): Cell {
    const cell: Cell = new Cell();
    cell.items = items;
    return cell;
}

describe('map-spotted-items', (): void => {
    describe('cellSpottedItems', (): void => {
        it('retient l\'objet repéré le plus nombreux, intacts et cassés cumulés, et compte les autres', (): void => {
            const cell: Cell = cellWith(itemCount(1, 2), itemCount(3, 9), itemCount(2, 2), itemCount(2, 1, true));

            expect(cellSpottedItems(cell, new Set<number>([1, 2]))).toEqual({ main_item_id: 2, others: 1 });
        });

        it('départage une égalité par l\'ordre de la case', (): void => {
            const cell: Cell = cellWith(itemCount(2, 3), itemCount(1, 3));

            expect(cellSpottedItems(cell, new Set<number>([1, 2]))).toEqual({ main_item_id: 2, others: 1 });
        });

        it('ignore une case sans aucun des objets', (): void => {
            expect(cellSpottedItems(cellWith(itemCount(3, 4)), new Set<number>([1]))).toBeNull();
        });

        it('ne repère rien sans objet choisi', (): void => {
            expect(cellSpottedItems(cellWith(itemCount(1, 1)), NO_SPOTTED_ITEMS)).toBeNull();
        });

        it('tolère une case dont les objets ne sont pas connus', (): void => {
            expect(cellSpottedItems(new Cell(), new Set<number>([1]))).toBeNull();
        });
    });

    describe('spottedItemsFirst', (): void => {
        it('place les objets repérés en tête, sans changer l\'ordre de part et d\'autre', (): void => {
            const items: ItemCountShort[] = [itemCount(5, 1), itemCount(1, 1), itemCount(6, 1), itemCount(2, 1, true)];

            expect(spottedItemsFirst(items, new Set<number>([1, 2])).map((item: ItemCountShort): number => item.item_id)).toEqual([1, 2, 5, 6]);
        });

        it('rend la liste d\'origine quand rien n\'est à déplacer', (): void => {
            const items: ItemCountShort[] = [itemCount(5, 1), itemCount(1, 1)];

            expect(spottedItemsFirst(items, NO_SPOTTED_ITEMS)).toBe(items);
            expect(spottedItemsFirst(items, new Set<number>([9]))).toBe(items);
            expect(spottedItemsFirst(items, new Set<number>([1, 5]))).toBe(items);
        });
    });

    describe('spottedQuantity', (): void => {
        it('additionne les objets repérés au sol de la case, cassés compris', (): void => {
            expect(spottedQuantity(cellWith(itemCount(1, 2), itemCount(1, 1, true), itemCount(3, 5)), new Set<number>([1]))).toBe(3);
        });

        it('ne compte rien pour la ville, une case inconnue ou sans objet repéré', (): void => {
            const town: Cell = cellWith(itemCount(1, 2));
            town.is_town = true;

            expect(spottedQuantity(town, new Set<number>([1]))).toBe(0);
            expect(spottedQuantity(undefined, new Set<number>([1]))).toBe(0);
            expect(spottedQuantity(cellWith(itemCount(1, 2)), NO_SPOTTED_ITEMS)).toBe(0);
        });
    });

    describe('itemCountsOnMap', (): void => {
        it('additionne la quantité au sol de chaque objet sur toutes les cases, cassés compris', (): void => {
            const counts: ReadonlyMap<number, number> = itemCountsOnMap([
                cellWith(itemCount(1, 2), itemCount(1, 1, true)),
                cellWith(itemCount(2, 4), itemCount(1, 3)),
                new Cell()
            ]);

            expect([...counts]).toEqual([[1, 6], [2, 4]]);
        });

        it('rend une carte vide sans cases', (): void => {
            expect(itemCountsOnMap(undefined).size).toBe(0);
        });
    });

    describe('sanitizeSpottedItemUids', (): void => {
        it('garde les uids enregistrés, sans doublon ni valeur invalide', (): void => {
            expect(sanitizeSpottedItemUids(['water_#00', 'wood2_#00', 'water_#00', 3, '', null])).toEqual(['water_#00', 'wood2_#00']);
        });

        it('écarte une valeur absente ou d\'un autre format', (): void => {
            expect(sanitizeSpottedItemUids(undefined)).toEqual([]);
            expect(sanitizeSpottedItemUids('water_#00')).toEqual([]);
            expect(sanitizeSpottedItemUids({ uid: 'water_#00' })).toEqual([]);
        });
    });

    describe('spottedItemsSummary', (): void => {
        it('compte les cases et additionne les quantités des objets choisis, cassés compris', (): void => {
            const cells: Cell[] = [
                cellWith(itemCount(1, 2), itemCount(1, 1, true), itemCount(9, 5)),
                cellWith(itemCount(2, 4)),
                cellWith(itemCount(9, 3)),
                new Cell()
            ];

            expect(spottedItemsSummary(cells, new Set<number>([1, 2]))).toEqual({ cells: 2, quantity: 7 });
        });

        it('renvoie un bilan nul sans cases ou sans objet choisi', (): void => {
            expect(spottedItemsSummary(undefined, new Set<number>([1]))).toEqual({ cells: 0, quantity: 0 });
            expect(spottedItemsSummary([cellWith(itemCount(1, 2))], NO_SPOTTED_ITEMS)).toEqual({ cells: 0, quantity: 0 });
        });
    });
});
