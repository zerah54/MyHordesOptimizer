import { I18nLabels } from '../types/_types';

/** Une ressource requise par un chantier. */
export interface BuildingResourceDTO {
    itemId: number;
    uid: string;
    img: string;
    label: I18nLabels;
    count: number;
}

/**
 * Un chantier du référentiel.
 *
 * Les coûts (`pa`, `resources`) sont ceux du jeu de ressources PAR DÉFAUT. Le mode Pandémonium
 * en utilise un autre, réellement différent pour 71 chantiers sur 166 — la page doit le dire.
 */
export interface BuildingDTO {
    id: number;
    uid: string;
    img: string;
    label: I18nLabels;
    description: I18nLabels;
    /** Chantier dont celui-ci est une évolution, `null` pour une racine. */
    parentId: number | null;
    /** Rang d'affichage du jeu. NON UNIQUE : rang au sein d'un groupe. */
    displayOrder: number | null;
    pa: number;
    defence: number;
    maxLife: number;
    breakable: boolean;
    temporary: boolean;
    hasUpgrade: boolean;
    /** Niveau de plan requis. 0 = sans plan. 5 et 6 ne sont pas des raretés — voir `BlueprintEnum`. */
    rarity: number;
    resources: BuildingResourceDTO[];
}
