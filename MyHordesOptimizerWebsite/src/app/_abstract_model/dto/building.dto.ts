import { I18nLabels, TownTypeId } from '../types/_types';

/** Une ressource requise par un chantier. */
export interface BuildingResourceDTO {
    itemId: number;
    uid: string;
    img: string;
    label: I18nLabels;
    count: number;
}

export type BuildingAvailabilityStatusDTO = 'Initial' | 'Unlocked' | 'Disabled';

/** Un chantier du référentiel. */
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
    /** Jeu de ressources Default — celui affiché hors Pandémonium. */
    resources: BuildingResourceDTO[];
    /** Vrai si ce chantier a un jeu de ressources Pandémonium distinct. */
    hasHardMode: boolean;
    /** 0 plan lu — jeu Hard. `null` si hasHardMode est faux. */
    tier0Ap: number | null;
    tier0Resources: BuildingResourceDTO[];
    /** 1 plan lu — jeu Easy. Les ressources de tier2 sont IDENTIQUES. */
    tier1Ap: number | null;
    tier1Resources: BuildingResourceDTO[];
    /** 2 plans lus — jeu Easy avec PA réduit. Pas de tier2Resources : identiques à tier1Resources. */
    tier2Ap: number | null;
    /**
     * Niveau de plan réellement requis en Pandémonium, quand ce chantier est overridé nommément
     * dans rules.yml. `null` si le chantier ne relève que de la règle générique — dans ce cas, la
     * rareté de base (`rarity`) reste la seule affichable.
     */
    hardBlueprintLevel: number | null;
    /** Disponibilité par TownType. Une entrée absente signifie « disponible normalement ». */
    availability: Partial<Record<TownTypeId, BuildingAvailabilityStatusDTO>>;
}
