import { Pipe, PipeTransform } from '@angular/core';

import { Cell } from '../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';

/** Aucun objet à repérer : une seule instance, partagée par toutes les cases. */
export const NO_SPOTTED_ITEMS: ReadonlySet<number> = new Set<number>();

/** Bilan du repérage : cases portant au moins un des objets, et quantité totale au sol. */
export interface SpottedItemsSummary {
    readonly cells: number;
    readonly quantity: number;
}

/** Objets repérés présents sur une case. */
export interface CellSpottedItems {
    /** Le plus nombreux, cassés compris ; à égalité, le premier de la case. */
    readonly main_item_id: number;
    /** Nombre d'autres objets repérés distincts sur la case. */
    readonly others: number;
}

/** Uids enregistrés dans les options de la carte : une valeur corrompue ou d'un autre format est écartée, un doublon retiré. */
export function sanitizeSpottedItemUids(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set<string>(value.filter((uid: unknown): uid is string => typeof uid === 'string' && uid !== ''))];
}

/** Objets repérés présents sur la case, `null` si elle n'en porte aucun. */
export function cellSpottedItems(cell: Cell, item_ids: ReadonlySet<number>): CellSpottedItems | null {
    if (item_ids.size === 0 || !cell.items?.length) return null;

    // Un même objet peut figurer deux fois, intact et cassé : les quantités sont cumulées par objet.
    const quantities: Map<number, number> = new Map<number, number>();
    for (const item of cell.items) {
        if (item_ids.has(item.item_id)) {
            quantities.set(item.item_id, (quantities.get(item.item_id) ?? 0) + (item.count ?? 0));
        }
    }
    if (quantities.size === 0) return null;

    let main_item_id: number = -1;
    let main_quantity: number = -1;
    for (const [item_id, quantity] of quantities) {
        if (quantity > main_quantity) {
            main_item_id = item_id;
            main_quantity = quantity;
        }
    }
    return { main_item_id, others: quantities.size - 1 };
}

/** Quantité au sol des objets repérés sur la case, cassés compris ; 0 pour la ville, qui n'a pas de sol à fouiller. */
export function spottedQuantity(cell: Cell | undefined, item_ids: ReadonlySet<number>): number {
    if (!cell || cell.is_town || item_ids.size === 0) return 0;
    let quantity: number = 0;
    for (const item of cell.items ?? []) {
        if (item_ids.has(item.item_id)) quantity += item.count ?? 0;
    }
    return quantity;
}

/** Quantité au sol de chaque objet sur les cases de la carte, par id, objets cassés compris. */
export function itemCountsOnMap(cells: readonly Cell[] | undefined): ReadonlyMap<number, number> {
    const counts: Map<number, number> = new Map<number, number>();
    for (const cell of cells ?? []) {
        for (const item of cell.items ?? []) {
            counts.set(item.item_id, (counts.get(item.item_id) ?? 0) + (item.count ?? 0));
        }
    }
    return counts;
}

/** Bilan du repérage sur les cases de la carte, objets cassés compris. */
export function spottedItemsSummary(cells: readonly Cell[] | undefined, item_ids: ReadonlySet<number>): SpottedItemsSummary {
    let cell_count: number = 0;
    let quantity: number = 0;
    if (!cells || item_ids.size === 0) return { cells: cell_count, quantity };

    for (const cell of cells) {
        let found: boolean = false;
        for (const item of cell.items ?? []) {
            if (!item_ids.has(item.item_id)) continue;
            found = true;
            quantity += item.count ?? 0;
        }
        if (found) cell_count++;
    }
    return { cells: cell_count, quantity };
}

/** Objets d'une case, les objets repérés en tête ; l'ordre est conservé de part et d'autre. Sans objet repéré, la liste d'origine. */
export function spottedItemsFirst(items: ItemCountShort[], item_ids: ReadonlySet<number>): ItemCountShort[] {
    if (item_ids.size === 0) return items;
    const spotted: ItemCountShort[] = items.filter((item: ItemCountShort): boolean => item_ids.has(item.item_id));
    if (spotted.length === 0 || spotted.length === items.length) return items;
    return [...spotted, ...items.filter((item: ItemCountShort): boolean => !item_ids.has(item.item_id))];
}

@Pipe({
    name: 'spottedItemsFirst'
})
export class SpottedItemsFirstPipe implements PipeTransform {
    public transform(items: ItemCountShort[], item_ids: ReadonlySet<number>): ItemCountShort[] {
        return spottedItemsFirst(items, item_ids);
    }
}
