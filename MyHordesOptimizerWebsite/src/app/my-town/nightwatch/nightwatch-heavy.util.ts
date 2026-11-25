import { Item } from '../../_abstract_model/types/item.class';

/** Encombrants tolérés au-delà de la limite normale (ex. Kalashnik'eau vide remplie une fois dans le sac). */
export const HEAVY_TOLERANCE: number = 1;

/**
 * Emplacements d'encombrants libres dans le sac d'un veilleur : 1 encombrant, 2 avec le bouclier du Gardien (règle du jeu), hors tolérance.
 * @param {Record<number, number>} items Objets attribués (quantité par objet).
 * @param {readonly Item[]} catalog Objets du jeu (drapeau encombrant).
 * @param {boolean} is_guardian Le veilleur est Gardien.
 * @returns {number} Emplacements libres, négatif en cas de dépassement.
 */
export function heavySlotsLeft(items: Record<number, number>, catalog: readonly Item[], is_guardian: boolean): number {
    const used: number = Object.entries(items)
        .filter(([item_id]: [string, number]): boolean => isHeavy(catalog, Number(item_id)))
        .reduce((total: number, [, quantity]: [string, number]): number => total + quantity, 0);
    return (is_guardian ? 2 : 1) - used;
}

/**
 * Vrai pour un objet encombrant ; un objet absent du catalogue ne l'est pas.
 * @param {readonly Item[]} catalog Objets du jeu.
 * @param {number} item_id Objet.
 * @returns {boolean} Encombrant.
 */
export function isHeavy(catalog: readonly Item[], item_id: number): boolean {
    return catalog.find((item: Item): boolean => item.id === item_id)?.is_heaver === true;
}
