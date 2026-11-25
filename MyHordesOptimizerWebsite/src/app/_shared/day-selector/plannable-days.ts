/** Jour à partir duquel l'horizon cesse d'être fixe et suit le jour courant. */
const HORIZON_BASE_DAY: number = 40;
/** Jours proposés au-delà de l'horizon de base (ou du jour courant une fois celui-ci dépassé). */
const HORIZON_EXTRA_DAYS: number = 10;

/**
 * Jours planifiables : d'aujourd'hui à max(J40, aujourd'hui) + 10, plus les jours ayant déjà une proposition.
 * @param {number} current_day Jour courant de la ville.
 * @param {number[]} planned_days Jours ayant une proposition (passés compris).
 * @returns {number[]} Jours croissants, sans doublon.
 */
export function plannableDays(current_day: number, planned_days: number[]): number[] {
    const days: Set<number> = new Set<number>(planned_days);
    const last_day: number = Math.max(HORIZON_BASE_DAY, current_day) + HORIZON_EXTRA_DAYS;
    for (let day: number = current_day; day <= last_day; day++) {
        days.add(day);
    }
    return Array.from(days).sort((a: number, b: number): number => a - b);
}
