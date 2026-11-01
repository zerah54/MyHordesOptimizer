/** Tri des objets proposés par le menu d'ajout : par catégorie, ou par quantité pour une liste qui fournit ses quantités. */
export type ItemsSortMode = 'category' | 'quantity';

export const DEFAULT_ITEMS_SORT_MODE: ItemsSortMode = 'category';

/** Tri enregistré : une valeur inconnue ou corrompue revient au tri par catégorie. */
export function sanitizeItemsSortMode(value: unknown): ItemsSortMode {
    return value === 'quantity' ? 'quantity' : DEFAULT_ITEMS_SORT_MODE;
}
