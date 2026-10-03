import { Pipe, PipeTransform } from '@angular/core';

import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { MapOptions } from '../../../map.component';

/** Palier d'abondance d'une zone, de 0 (épuisée) à 3 (abondante). */
export type DigLevel = 0 | 1 | 2 | 3;

export interface DigLevelInfo {
    level: DigLevel;
    /** Libellé du jeu. */
    label: string;
    /** Fouilles restantes couvertes par le palier. */
    range: string;
}

/**
 * Paliers et libellés de MyHordes : le niveau que le jeu montre au fouineur (`BeyondController`,
 * `dig_level`) vaut 0 pour une zone épuisée, 1 jusqu'à 2 fouilles restantes, 2 jusqu'à 6, 3 au-delà.
 * La carte estimée suit la même échelle, pour que ses couleurs disent la même chose.
 */
export const DIG_LEVELS: readonly DigLevelInfo[] = [
    { level: 0, label: $localize`Zone épuisée`, range: '0' },
    { level: 1, label: $localize`Zone presque épuisée`, range: '1–2' },
    { level: 2, label: $localize`Zone à moitié vide`, range: '3–6' },
    { level: 3, label: $localize`Zone abondante`, range: '7+' }
];

/**
 * Fouilles restantes de la case, en estimation moyenne ou en plafond. L'API les tient à jour
 * (observations, régénérations, excavations, fouilles réussies) : il n'y a plus rien à en déduire.
 * Arrondi comme à l'affichage, jamais négatif.
 */
export function remainingDigs(cell: Cell, option: MapOptions): number {
    const remaining: number = (option.dig_mode === 'max' ? cell.max_potential_remaining_dig : cell.average_potential_remaining_dig) ?? 0;
    return Math.max(0, Math.round(remaining));
}

/** Palier correspondant à un nombre de fouilles restantes. */
export function digLevelOf(remaining: number): DigLevel {
    if (remaining <= 0) return 0;
    if (remaining <= 2) return 1;
    if (remaining <= 6) return 2;
    return 3;
}

/**
 * Palier d'abondance estimé de la case. Exporté en fonction : la case en a besoin dans un
 * `computed`, où un pipe n'aurait pas sa place. Le relevé d'un fouineur n'a plus la priorité :
 * l'API en a déjà borné les fouilles restantes, et lui vieillit (fouilles, régénérations) quand
 * l'estimation suit.
 */
export function digLevel(cell: Cell, option: MapOptions): DigLevel {
    return digLevelOf(remainingDigs(cell, option));
}

/** Libellé du jeu pour un palier ; chaîne vide pour une valeur hors échelle. */
@Pipe({
    name: 'digLevelLabel'
})
export class DigLevelLabelPipe implements PipeTransform {
    public transform(level: number | null | undefined): string {
        return DIG_LEVELS.find((info: DigLevelInfo): boolean => info.level === level)?.label ?? '';
    }
}
