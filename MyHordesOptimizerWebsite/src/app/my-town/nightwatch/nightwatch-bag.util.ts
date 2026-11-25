import { Item } from '../../_abstract_model/types/item.class';

/** Discours rassurant multicoloré : case à cocher du plan, mais un objet du sac dans le jeu. */
export const DISCOURSE_UID: string = 'chkspk_#00';

/**
 * Contenu du sac pour le composant de sac : un objet par exemplaire, puis le Discours rassurant s'il est porté ; objets hors catalogue omis.
 * @param {Record<number, number>} items Quantité par objet.
 * @param {readonly Item[]} catalog Objets du jeu.
 * @param {boolean} discourse Le veilleur porte le Discours rassurant.
 * @returns {Item[]} Objets du sac.
 */
export function bagItems(items: Record<number, number>, catalog: readonly Item[], discourse: boolean): Item[] {
    const content: Item[] = Object.entries(items).flatMap(([item_id, quantity]: [string, number]): Item[] => {
        const item: Item | undefined = catalog.find((candidate: Item): boolean => candidate.id === Number(item_id));
        return item === undefined ? [] : Array.from({ length: quantity }, (): Item => item);
    });
    const discourse_item: Item | undefined = discourse ? catalog.find((candidate: Item): boolean => candidate.uid === DISCOURSE_UID) : undefined;
    return discourse_item === undefined ? content : [...content, discourse_item];
}

/**
 * Places occupées : une par exemplaire d'objet non essentiel, une de plus pour le Discours rassurant porté.
 * @param {Record<number, number>} items Quantité par objet.
 * @param {ReadonlySet<number>} essential_ids Objets essentiels (ils rendent la place qu'ils prennent).
 * @param {boolean} discourse Le veilleur porte le Discours rassurant.
 * @returns {number} Places occupées.
 */
export function bagUsed(items: Record<number, number>, essential_ids: ReadonlySet<number>, discourse: boolean): number {
    const used: number = Object.entries(items)
        .filter(([item_id]: [string, number]): boolean => !essential_ids.has(Number(item_id)))
        .reduce((total: number, [, quantity]: [string, number]): number => total + quantity, 0);
    return used + (discourse ? 1 : 0);
}

/**
 * Uids des objets du sac connus du catalogue (extensions comprises).
 * @param {Record<number, number>} items Quantité par objet.
 * @param {readonly Item[]} catalog Objets du jeu.
 * @returns {string[]} Uids.
 */
export function bagItemUids(items: Record<number, number>, catalog: readonly Item[]): string[] {
    return Object.keys(items)
        .map((item_id: string): string | undefined => catalog.find((item: Item): boolean => item.id === Number(item_id))?.uid)
        .filter((uid: string | undefined): uid is string => uid !== undefined);
}
