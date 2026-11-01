import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

import { Item } from '../../_abstract_model/types/item.class';
import { localizedLabel, normalizeString } from '../../_core/utilities/string.utils';

/**
 * Objets du plus nombreux au moins nombreux (à égalité, par libellé), puis ceux à 0, dans l'ordre des
 * catégories comme la vue groupée. Copie : la liste reçue n'est pas réordonnée.
 */
export function itemsByQuantity(items: readonly Item[], counts: ReadonlyMap<number, number>, locale: string): Item[] {
    const labels: Map<number, string> = new Map<number, string>(items.map((item: Item): [number, string] => {
        return [item.id, normalizeString(localizedLabel(item.label, locale))];
    }));
    const byLabel: (item_a: Item, item_b: Item) => number = (item_a: Item, item_b: Item): number => {
        return (labels.get(item_a.id) ?? '').localeCompare(labels.get(item_b.id) ?? '');
    };

    const present: Item[] = [];
    const absent: Item[] = [];
    for (const item of items) {
        ((counts.get(item.id) ?? 0) > 0 ? present : absent).push(item);
    }

    present.sort((item_a: Item, item_b: Item): number => (counts.get(item_b.id) ?? 0) - (counts.get(item_a.id) ?? 0) || byLabel(item_a, item_b));
    absent.sort((item_a: Item, item_b: Item): number => categoryOrdering(item_a) - categoryOrdering(item_b) || byLabel(item_a, item_b));
    return [...present, ...absent];
}

/** Rang de la catégorie ; une catégorie sans rang passe en fin, comme dans la vue groupée. */
function categoryOrdering(item: Item): number {
    const ordering: number | undefined = item.category?.ordering;
    return ordering !== undefined && Number.isFinite(ordering) ? ordering : Number.MAX_SAFE_INTEGER;
}

@Pipe({
    name: 'itemsByQuantity'
})
export class ItemsByQuantityPipe implements PipeTransform {
    private readonly locale: string = moment.locale();

    public transform(items: Item[], counts: ReadonlyMap<number, number>): Item[] {
        return itemsByQuantity(items, counts, this.locale);
    }
}
