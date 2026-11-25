/** Source d'une valeur du référentiel : lue dans le jeu ou convention des leads. */
export type NightwatchSource = 'game' | 'excel';

/** Usage d'un objet après la veille. */
export type NightwatchItemUsage = 'repair' | 'recharge' | 'single' | 'permanent';

/** Défense et pénalité de survie d'un statut. `deathRisk` : fraction ajoutée au risque (positif = pénalité). */
export interface NightwatchStatusDefDTO {
    defense: number;
    deathRisk: number;
    source: NightwatchSource;
}

/** Paramètres de veille d'un objet. `watchImpact` : fraction retranchée au risque. */
export interface NightwatchItemDefDTO {
    defense: number;
    usage: NightwatchItemUsage;
    repairPa: number;
    repairPaSource: string;
    isEssential: boolean;
    batteries: number;
    water: number;
    watchImpact: number;
    cumulative: boolean;
    source: NightwatchSource;
}

/** Bonus de défense d'un chantier sur des objets : `défense = floor(défense * (1 + factor))`. */
export interface NightwatchDefenseBonusDTO {
    buildingUid: string;
    factor: number;
    idItems: number[];
}

/** Paramètres du modèle de veille ; tous les risques sont des fractions (0,08 = 8 %). */
export interface NightwatchReferentialDTO {
    baseRisk: number;
    fatigue: number[];
    fatiguePro: number[];
    statuses: Record<string, NightwatchStatusDefDTO>;
    items: Record<number, NightwatchItemDefDTO>;
    watcherCapByRoundPathLevel: Record<number, number>;
    roundPathLevel3Bonus: number;
    guardRoomBonus: number;
    sprinklerMalus: number;
    bathBonus: number;
    discourseDefense: number;
    itemDefenseRequiresBuildingUid: string;
    defenseBonuses: NightwatchDefenseBonusDTO[];
}

/** Veilleur d'une proposition de plan. */
export interface NightwatchWatcherDTO {
    userId: number;
    statuses: string[];
    items: Record<number, number>;
    pastWatches?: number | null;
    hasDiscourse: boolean;
    note?: string | null;
}

/** Défense de la ville saisie ou dérivée pour une proposition ; `adLevel` : -1 = non construit, 0 à 3. */
export interface NightwatchCityDefenseDTO {
    buildings?: number | null;
    upgrades?: number | null;
    wall?: number | null;
    bankDefenseItems?: number | null;
    homes?: number | null;
    guardians?: number | null;
    guardTowerPa?: number | null;
    souls?: number | null;
    cemetery?: number | null;
    eveningVote?: number | null;
    dumpContribution?: number | null;
    fddCoefficient?: number | null;
    adLevel?: number | null;
}

/** Contenu JSON d'une proposition de plan de veille. */
export interface NightwatchPlanContentDTO {
    globalItems?: Record<number, number> | null;
    cityDefense?: NightwatchCityDefenseDTO | null;
    allowedOverflow?: number | null;
    attackReductionPercent?: number | null;
    reactorDamage?: number | null;
    attackOverride?: number | null;
    /** Proposition de Chantiers retenue pour le jour de la veille ; absente ou nulle = l'effective. */
    buildingPlanId?: number | null;
    instructions?: string | null;
    watchers: NightwatchWatcherDTO[];
    manualStock: Record<number, number>;
}

/** Dernière mise à jour d'une donnée (`updateTime` : date ISO UTC). */
export interface NightwatchLastUpdateInfoDTO {
    userId: number;
    userName: string;
    updateTime: string;
}

/** Proposition de plan de veille d'un jour. */
export interface NightwatchPlanDTO {
    id: number;
    day: number;
    name: string;
    isEffective: boolean;
    version: number;
    authorId: number;
    authorName?: string | null;
    simulationId?: number | null;
    content: NightwatchPlanContentDTO;
    lastUpdateInfo?: NightwatchLastUpdateInfoDTO | null;
}

/** Simulation de stock d'une ville : stock hypothétique rattaché à des propositions. */
export interface NightwatchSimulationDTO {
    id: number;
    name: string;
    lastDay: number;
    stock: Record<number, number>;
    version: number;
    lastUpdateInfo: NightwatchLastUpdateInfoDTO | null;
}

/** Requête de création (sans `id`) ou de modification (`id` + `version`) d'une simulation. */
export interface NightwatchSimulationRequestDTO {
    id?: number | null;
    name: string;
    lastDay: number;
    stock: Record<number, number>;
    version?: number | null;
}

/** Droits de l'utilisateur sur les plans de veille de la ville. */
export interface NightwatchPlanAccessDTO {
    isCitizen: boolean;
    canEdit: boolean;
}

/** Réponse de la liste des plans de veille. */
export interface NightwatchPlansDTO {
    access: NightwatchPlanAccessDTO;
    plans: NightwatchPlanDTO[];
    simulations?: NightwatchSimulationDTO[];
}

/** État réel d'un citoyen vivant. Les dictionnaires sont indexés par `Item.IdItem`. */
export interface NightwatchCitizenStateDTO {
    userId: number;
    name: string;
    jobUid?: string | null;
    isShunned: boolean;
    isGhoul: boolean;
    isDrugged: boolean;
    isDrunk: boolean;
    isThirsty: boolean;
    isImmune: boolean;
    bag: Record<number, number>;
    bagBroken: Record<number, number>;
    chest: Record<number, number>;
    chestBroken: Record<number, number>;
    chestUpdatedAt?: string | null;
    bagUpdatedAt?: string | null;
}

/** État réel de la ville lu en BDD pour le plan de veille. */
export interface NightwatchStateDTO {
    citizens: NightwatchCitizenStateDTO[];
    bank: Record<number, number>;
    bankBroken: Record<number, number>;
    desert: Record<number, number>;
    desertBroken: Record<number, number>;
    roundPathLevel: number;
    hasGuardRoom: boolean;
    hasSprinkler: boolean;
    builtBuildingUids: string[];
    townIsPanda: boolean;
    pastWatches: Record<number, number>;
}

/** Requête de création (sans `id`) ou de modification (`id` + `version`) d'une proposition de plan de veille. */
export interface NightwatchPlanRequestDTO {
    id?: number | null;
    version?: number | null;
    day: number;
    name: string;
    simulationId?: number | null;
    content: NightwatchPlanContentDTO;
}

/**
 * Contenu d'une proposition vide.
 * @returns {NightwatchPlanContentDTO} Contenu sans veilleur.
 */
export function emptyNightwatchContent(): NightwatchPlanContentDTO {
    return { attackOverride: null, instructions: null, watchers: [], manualStock: {} };
}
