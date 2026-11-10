import { Cell } from '../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';

/** Case de la carte où un objet est au sol. */
export interface ItemSpot {
    x: number;
    y: number;
    /** Exemplaires au sol, cassés compris. */
    count: number;
    /** Vrai si au moins un exemplaire est cassé. */
    broken: boolean;
}

/**
 * Cases où chaque objet est au sol, objets cassés et case de la ville compris, comme le compte du serveur.
 * @param {readonly Cell[]} cells Cases de la carte.
 * @returns {Map<number, ItemSpot[]>} Cases par identifiant d'objet, dans l'ordre des cases.
 */
export function spotsByItem(cells: readonly Cell[]): Map<number, ItemSpot[]> {
    const spots: Map<number, ItemSpot[]> = new Map<number, ItemSpot[]>();
    for (const cell of cells) {
        const on_cell: Map<number, ItemSpot> = new Map<number, ItemSpot>();
        (cell.items ?? []).forEach((item: ItemCountShort): void => {
            if (item.count <= 0) {
                return;
            }
            const spot: ItemSpot = on_cell.get(item.item_id) ?? { x: cell.x, y: cell.y, count: 0, broken: false };
            on_cell.set(item.item_id, { ...spot, count: spot.count + item.count, broken: spot.broken || item.is_broken });
        });
        on_cell.forEach((spot: ItemSpot, item_id: number): void => {
            spots.set(item_id, [...(spots.get(item_id) ?? []), spot]);
        });
    }
    return spots;
}
