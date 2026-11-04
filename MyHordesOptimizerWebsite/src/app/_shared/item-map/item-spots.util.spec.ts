import { Cell } from '../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';
import { ItemSpot, spotsByItem } from './item-spots.util';

function cell(x: number, y: number, items: { id: number; count: number; broken?: boolean }[], is_town: boolean = false): Cell {
    return Object.assign(new Cell(), {
        x, y, is_town,
        items: items.map((item: { id: number; count: number; broken?: boolean }): ItemCountShort =>
            Object.assign(new ItemCountShort(), { item_id: item.id, count: item.count, is_broken: item.broken === true }))
    });
}

describe('item-spots.util', (): void => {
    it('spotsByItem : cases où chaque objet est au sol, objets cassés compris', (): void => {
        const spots: Map<number, ItemSpot[]> = spotsByItem([
            cell(3, 4, [{ id: 5, count: 2 }, { id: 7, count: 1, broken: true }]),
            cell(6, 1, [{ id: 5, count: 1 }])
        ]);

        expect(spots.get(5)).toEqual([{ x: 3, y: 4, count: 2, broken: false }, { x: 6, y: 1, count: 1, broken: false }]);
        expect(spots.get(7)).toEqual([{ x: 3, y: 4, count: 1, broken: true }]);
    });

    it('spotsByItem : réunit sur une case les exemplaires intacts et cassés d\'un même objet', (): void => {
        const spots: Map<number, ItemSpot[]> = spotsByItem([cell(3, 4, [{ id: 5, count: 2 }, { id: 5, count: 1, broken: true }])]);

        expect(spots.get(5)).toEqual([{ x: 3, y: 4, count: 3, broken: true }]);
    });

    it('spotsByItem : compte aussi la case de la ville, comme le serveur', (): void => {
        expect(spotsByItem([cell(5, 5, [{ id: 5, count: 4 }], true)]).get(5)).toEqual([{ x: 5, y: 5, count: 4, broken: false }]);
    });

    it('spotsByItem : ignore les cases sans objets connus et les quantités nulles', (): void => {
        expect(spotsByItem([Object.assign(new Cell(), { x: 1, y: 1 }), cell(2, 2, [{ id: 5, count: 0 }])]).size).toBe(0);
    });
});
