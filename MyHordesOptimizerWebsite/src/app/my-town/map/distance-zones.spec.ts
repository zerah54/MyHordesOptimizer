import { Cell } from '../../_abstract_model/types/cell.class';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';
import { countItemsInZone, distanceBorder, itemsWithUids } from './distance-zones';
import { Distance } from './map.component';

function newCell(nb_km: number, nb_pa: number, items: [number, number, boolean?][]): Cell {
    const cell: Cell = new Cell();
    cell.nb_km = nb_km;
    cell.nb_pa = nb_pa;
    cell.items = items.map(([item_id, count, is_broken]: [number, number, boolean?]): ItemCountShort => {
        const item_count: ItemCountShort = new ItemCountShort();
        item_count.item_id = item_id;
        item_count.count = count;
        item_count.is_broken = is_broken ?? false;
        return item_count;
    });
    return cell;
}

function newItem(id: number, uid: string): Item {
    const item: Item = new Item();
    item.id = id;
    item.uid = uid;
    return item;
}

describe('distanceBorder', (): void => {
    it('garde l\'apparence d\'origine pour une zone sans couleur ni style', (): void => {
        expect(distanceBorder({ value: 5, unit: 'km' })).toBe('2px dashed var(--mho-map-fg)');
    });

    it('applique la couleur et le style choisis', (): void => {
        expect(distanceBorder({ value: 5, unit: 'km', color: '#e0483d', border_style: 'dotted' })).toBe('2px dotted #e0483d');
    });
});

describe('itemsWithUids', (): void => {
    const water: Item = newItem(1, 'water_#00');
    const plank: Item = newItem(2, 'wood_bad_#00');

    it('ne garde que les objets sélectionnés', (): void => {
        expect(itemsWithUids(['wood_bad_#00'], [water, plank])).toEqual([plank]);
    });

    it('ignore un objet disparu du référentiel et une zone sans objets', (): void => {
        expect(itemsWithUids(['disparu_#00'], [water])).toEqual([]);
        expect(itemsWithUids(undefined, [water])).toEqual([]);
    });

    it('ne renvoie rien tant que les objets ne sont pas chargés', (): void => {
        expect(itemsWithUids(['water_#00'], undefined)).toEqual([]);
    });
});

describe('countItemsInZone', (): void => {
    const WATER: number = 1;
    const PLANK: number = 2;
    const items: Item[] = [newItem(WATER, 'water_#00'), newItem(PLANK, 'wood_bad_#00'), newItem(3, 'metal_#00')];
    const cells: Cell[] = [
        newCell(0, 0, [[WATER, 50]]),
        newCell(1, 1, [[WATER, 2], [PLANK, 1]]),
        newCell(5, 7, [[WATER, 3, true], [3, 40]]),
        newCell(6, 8, [[WATER, 100]])
    ];

    it('additionne de 1 km à la distance de la zone, sans la ville ni au-delà', (): void => {
        const zone: Distance = { value: 5, unit: 'km', item_uids: ['water_#00'] };
        expect(countItemsInZone(zone, cells, items)).toBe(5);
    });

    it('additionne tous les objets sélectionnés', (): void => {
        const zone: Distance = { value: 5, unit: 'km', item_uids: ['water_#00', 'wood_bad_#00'] };
        expect(countItemsInZone(zone, cells, items)).toBe(6);
    });

    it('compte une zone en PA sur la distance en PA', (): void => {
        const zone: Distance = { value: 7, unit: 'pa', item_uids: ['water_#00'] };
        expect(countItemsInZone(zone, cells, items)).toBe(5);
    });

    it('ne garde que la moitié du budget pour une zone en PA aller/retour', (): void => {
        const zone: Distance = { value: 7, unit: 'pa', round_trip: true, item_uids: ['water_#00'] };
        expect(countItemsInZone(zone, cells, items)).toBe(2);
    });

    it('ignore un objet qui n\'existe plus dans le référentiel', (): void => {
        const zone: Distance = { value: 5, unit: 'km', item_uids: ['disparu_#00'] };
        expect(countItemsInZone(zone, cells, items)).toBe(0);
    });

    it('vaut 0 tant que la carte ou les objets ne sont pas chargés', (): void => {
        const zone: Distance = { value: 5, unit: 'km', item_uids: ['water_#00'] };
        expect(countItemsInZone(zone, undefined, items)).toBe(0);
        expect(countItemsInZone(zone, cells, undefined)).toBe(0);
    });
});
