/** Places d'un sac sans compétence ni extension (règle du jeu, `InventoryHandler::getSize`). */
const BASE_CAPACITY: number = 4;
/** Bonus de places de la compétence Endurant, par niveau MHO (0 = habitant). */
const ENDURANCE_BONUS: readonly number[] = [0, 1, 2, 2, 3];
/** Extensions de sac, non cumulables : seule la meilleure compte. */
const BAG_EXTENSIONS: Readonly<Record<string, number>> = { 'bag_#00': 2, 'bagxl_#00': 3, 'cart_#00': 3 };
const BELT_UID: string = 'pocket_belt_#00';
const BELT_BONUS: number = 2;

/** Objets qui agrandissent le sac (extensions et ceinture). */
export const BAG_SPACE_UIDS: readonly string[] = [...Object.keys(BAG_EXTENSIONS), BELT_UID];

/**
 * Bonus de places de la compétence Endurant.
 * @param {number | null} level Niveau MHO (0 = habitant) ; nul = inconnu.
 * @returns {number | null} Bonus, nul si le niveau est inconnu ou hors table.
 */
export function enduranceBonus(level: number | null): number | null {
    return level === null ? null : (ENDURANCE_BONUS[level] ?? null);
}

/**
 * Capacité d'un sac : base, bonus Endurant, meilleure extension et ceinture présentes dans le sac.
 * @param {number | null} level Niveau Endurant MHO ; nul = inconnu.
 * @param {readonly string[]} item_uids Uids des objets du sac.
 * @returns {number | null} Places, nulle si le niveau est inconnu.
 */
export function bagCapacity(level: number | null, item_uids: readonly string[]): number | null {
    const bonus: number | null = enduranceBonus(level);
    return bonus === null ? null : capacityWithBonus(bonus, item_uids);
}

/**
 * Capacité sûre à afficher : exacte si le niveau est connu, sinon celle d'un habitant (minimum garanti).
 * @param {number | null} level Niveau Endurant MHO ; nul = inconnu.
 * @param {readonly string[]} item_uids Uids des objets du sac.
 * @returns {number} Places.
 */
export function displayedBagCapacity(level: number | null, item_uids: readonly string[]): number {
    return bagCapacity(level ?? 0, item_uids) ?? capacityWithBonus(0, item_uids);
}

/**
 * Vrai si le sac déborde ; un niveau inconnu est jugé avec le bonus maximal (pas de fausse alerte).
 * @param {number | null} level Niveau Endurant MHO ; nul = inconnu.
 * @param {readonly string[]} item_uids Uids des objets du sac.
 * @param {number} used Places occupées.
 * @returns {boolean} Dépassement.
 */
export function bagOverflow(level: number | null, item_uids: readonly string[], used: number): boolean {
    return used > maxBagCapacity(level, item_uids);
}

/**
 * Capacité maximale possible : exacte si le niveau est connu, avec le bonus Endurant maximal sinon.
 * @param {number | null} level Niveau Endurant MHO ; nul = inconnu.
 * @param {readonly string[]} item_uids Uids des objets du sac.
 * @returns {number} Places.
 */
export function maxBagCapacity(level: number | null, item_uids: readonly string[]): number {
    return capacityWithBonus(enduranceBonus(level) ?? Math.max(...ENDURANCE_BONUS), item_uids);
}

/**
 * Capacité pour un bonus Endurant connu.
 * @param {number} bonus Bonus Endurant.
 * @param {readonly string[]} item_uids Uids des objets du sac.
 * @returns {number} Places.
 */
function capacityWithBonus(bonus: number, item_uids: readonly string[]): number {
    const extension: number = Math.max(0, ...item_uids.map((uid: string): number => BAG_EXTENSIONS[uid] ?? 0));
    return BASE_CAPACITY + bonus + extension + (item_uids.includes(BELT_UID) ? BELT_BONUS : 0);
}
