/** Le jeu n'affiche '--' que pour un citoyen en ville ; tout le reste (coordonnées, porte, chaos) signifie dehors. */
export function isCitizenLocationOutside(locationText: string): boolean {
    return locationText.trim() !== '--';
}

export interface CitizenLocationSortKey {
    inTown: boolean;
    dist: number;
}

/** dist=Infinity quand le citoyen est dehors sans coordonnées connues (chaos/dévasté : le jeu n'affiche pas la position). */
export function getCitizenLocationSortKey(locationText: string): CitizenLocationSortKey {
    if (!isCitizenLocationOutside(locationText)) {
        return { inTown: true, dist: 0 };
    }
    const coords: RegExpMatchArray | null = locationText.match(/\[(-?\d+),(-?\d+)\]/);
    if (!coords) {
        return { inTown: false, dist: Infinity };
    }
    return { inTown: false, dist: Math.abs(parseInt(coords[1], 10)) + Math.abs(parseInt(coords[2], 10)) };
}