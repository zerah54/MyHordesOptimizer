/**
 * Arrondit à l'entier, la moitié vers le haut (nombres positifs), avec une tolérance contre le bruit flottant.
 * @param {number} value Valeur à arrondir.
 * @returns {number} Entier arrondi.
 */
export function roundHalfUp(value: number): number {
    return Math.floor(value + 0.5 + 1e-9);
}

/**
 * Facteur appliqué au coût en PA d'un chantier selon le niveau de l'atelier (`small_refine_#00`).
 * @param {number} level Niveau de l'atelier ; 0 ou invalide = pas d'atelier.
 * @returns {number} Facteur entre 0,65 et 1.
 */
export function workshopRatio(level: number): number {
    const safe_level: number = Number.isFinite(level) && level > 0 ? level : 0;
    if (safe_level === 4) {
        return 0.75;
    }
    if (safe_level === 5) {
        return 0.65;
    }
    return 1 - Math.min(0.06 * safe_level, 0.28);
}

/**
 * Points de vie rendus par PA investi en réparation.
 * @param {number} level Niveau de l'atelier.
 * @returns {number} PV par PA.
 */
export function repairHpPerAp(level: number): number {
    const safe_level: number = Number.isFinite(level) && level > 0 ? level : 0;
    return 2 + Math.max(0, safe_level - 3);
}

/**
 * Coût en PA d'un chantier une fois la réduction de l'atelier appliquée.
 * @param {number} paCurrent Coût de base dans la ville (`paCurrent`).
 * @param {number} level Niveau de l'atelier.
 * @returns {number} Coût réduit, arrondi.
 */
export function workshopCap(paCurrent: number, level: number): number {
    return roundHalfUp(paCurrent * workshopRatio(level));
}

/**
 * Nombre de PA à laisser sur un chantier pour qu'un vote d'évolution de l'atelier le termine gratuitement le lendemain.
 * @param {number} paCurrent Coût de base dans la ville.
 * @param {number} level Niveau de l'atelier aujourd'hui.
 * @returns {number} Seuil (≥ 0) : laisser au plus ce nombre de PA restants.
 */
export function freeThreshold(paCurrent: number, level: number): number {
    return Math.max(0, workshopCap(paCurrent, level) - workshopCap(paCurrent, level + 1));
}
