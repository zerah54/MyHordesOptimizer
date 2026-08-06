/**
 * Même origine (script Tampermonkey OU même extension) qui se relance dans le même document
 * (mise à jour non rafraîchie, réveil d'onglet) n'est pas un vrai doublon : seule une origine
 * différente signale un vrai conflit script + extension.
 */
export function isConflictingDoubleInstall(existingMarker: string | null, currentOrigin: string): boolean {
    return existingMarker !== null && existingMarker !== currentOrigin;
}
