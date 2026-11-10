import { Pipe, PipeTransform } from '@angular/core';

import { MapOptions } from '../../../map.component';

/** Bornes hautes des paliers 1 et 2, par mode ; au-delà, palier 3. */
const TIER_BOUNDS: Readonly<Record<MapOptions['trash_mode'], readonly [number, number]>> = {
    nb: [4, 8],
    def: [8, 16]
};

/**
 * Palier de remplissage d'une zone pour la carte « Décharge », de 0 (rien) à 3 (beaucoup).
 * @param {number} value Valeur de la zone.
 * @param {MapOptions['trash_mode']} mode Nombre d'objets ou défense.
 * @returns {number} Palier.
 */
export function trashLevel(value: number, mode: MapOptions['trash_mode']): number {
    const [first, second]: readonly [number, number] = TIER_BOUNDS[mode];
    if (value === 0) return 0;
    if (value <= first) return 1;
    if (value <= second) return 2;
    return 3;
}

@Pipe({
    name: 'trashLevel'
})
export class TrashLevelPipe implements PipeTransform {
    public transform(value: number, mode: MapOptions['trash_mode']): number {
        return trashLevel(value, mode);
    }
}
