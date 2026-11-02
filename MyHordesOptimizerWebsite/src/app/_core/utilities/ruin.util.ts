/** Places en camping au plus d'un bâtiment enseveli. */
const BURIED_RUIN_MAX_CAPACITY: number = 3;
/** Fouilles restantes nécessaires pour libérer une place dans un bâtiment enseveli. */
const BURIED_RUIN_DIGS_PER_PLACE: number = 3;

/**
 * Places en camping d'un bâtiment enseveli : une par tranche de 3 fouilles restantes, 3 au plus.
 * Même règle que `CampingService.GetBuildingCampingCapacity` côté API.
 *
 * @param bury_count Nombre de fouilles restantes pour déterrer le bâtiment.
 */
export function getBuriedRuinCapacity(bury_count: number): number {
    if (!Number.isFinite(bury_count) || bury_count <= 0) return 0;
    return Math.min(BURIED_RUIN_MAX_CAPACITY, Math.floor(bury_count / BURIED_RUIN_DIGS_PER_PLACE));
}
