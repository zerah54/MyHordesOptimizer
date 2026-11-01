/** Ressource requise par un niveau de maison ou une amélioration, identifiée par l'uid de l'objet. */
export interface HomeResourceDTO {
    itemUid: string;
    count: number;
}

/** Niveau de maison (0 = lit de camp). */
export interface HomeLevelDTO {
    level: number;
    label: string;
    icon: string;
    def: number;
    ap: number;
    apUrbanism: number;
    resources: HomeResourceDTO[];
    resourcesUrbanism: HomeResourceDTO[];
    buildingUid: string | null;
    allowsUpgrades: boolean;
    theft: boolean;
}

/** Niveau d'une amélioration de maison. */
export interface HomeUpgradeLevelDTO {
    level: number;
    ap: number;
    resources: HomeResourceDTO[];
}

/** Amélioration de maison et ses niveaux. */
export interface HomeUpgradeDTO {
    name: string;
    label: string;
    description: string;
    levels: HomeUpgradeLevelDTO[];
}

/** Référentiel des niveaux de maison et de leurs améliorations. */
export interface HomeReferentialDTO {
    levels: HomeLevelDTO[];
    upgrades: HomeUpgradeDTO[];
}
