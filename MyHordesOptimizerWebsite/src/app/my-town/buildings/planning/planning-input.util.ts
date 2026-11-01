/**
 * Convertit une saisie en entier relatif ; toute valeur invalide donne 0.
 * @param {unknown} value Valeur saisie.
 * @returns {number} Entier (tronqué vers 0).
 */
export function toInt(value: unknown): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const parsed: number = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

/**
 * Convertit une saisie en entier positif ou nul ; toute valeur invalide ou négative donne 0.
 * @param {unknown} value Valeur saisie.
 * @returns {number} Entier ≥ 0.
 */
export function toNonNegativeInt(value: unknown): number {
    return Math.max(0, toInt(value));
}
