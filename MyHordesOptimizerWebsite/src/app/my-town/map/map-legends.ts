import { DIG_LEVELS, DigLevelInfo } from './draw-map/map-cell/pipes/dig-level.pipe';
import { MapType } from './map-corners';

/** Couleur d'une entrée : un palier de l'échelle de la carte (`--mho-map-l0` à `l3`) ou le fond « inconnu ». */
export type MapLegendSwatch = 'level-0' | 'level-1' | 'level-2' | 'level-3' | 'unknown';

export interface MapLegendEntry {
    swatch: MapLegendSwatch;
    /** Libellé du jeu quand il en a un. */
    label: string;
    /** Valeurs couvertes, pour une échelle chiffrée. */
    range: string | null;
}

/**
 * Légende du panneau Affichage, par type de carte : mêmes couleurs que les cases
 * (map-cell.component.scss). Le sens de l'échelle dépend du type : pour les fouilles et
 * l'exploration, le palier 0 est défavorable ; pour le danger, c'est l'inverse.
 * - Danger : seuils du champ `danger` de l'API de MyHordes (`JSONv1Controller`, 1–2, 3–5, plus de
 *   5 zombies), libellés de sa carte (`MapController`) ; une zone pas vue aujourd'hui est inconnue.
 * - Exploration : niveau relevé par un éclaireur, libellés du jeu (`beyond.html.twig`).
 * - Décharge (développement) : pas de légende.
 */
export const MAP_LEGENDS: Readonly<Record<MapType, readonly MapLegendEntry[] | null>> = {
    digs: DIG_LEVELS.map((level: DigLevelInfo): MapLegendEntry => ({ swatch: `level-${level.level}`, label: level.label, range: level.range })),
    danger: [
        { swatch: 'level-3', label: $localize`Aucun zombie`, range: '0' },
        { swatch: 'level-2', label: $localize`Zombies isolés`, range: '1–2' },
        { swatch: 'level-1', label: $localize`Meute de zombies`, range: '3–5' },
        { swatch: 'level-0', label: $localize`Horde de zombies`, range: '6+' },
        { swatch: 'unknown', label: $localize`Pas vue aujourd'hui`, range: null }
    ],
    scout: [
        { swatch: 'level-0', label: $localize`Secteur peu connu`, range: null },
        { swatch: 'level-1', label: $localize`Secteur partiellement repéré`, range: null },
        { swatch: 'level-2', label: $localize`Secteur connu`, range: null },
        { swatch: 'level-3', label: $localize`Secteur totalement balisé`, range: null },
        { swatch: 'unknown', label: $localize`Niveau inconnu`, range: null }
    ],
    trash: null
};
