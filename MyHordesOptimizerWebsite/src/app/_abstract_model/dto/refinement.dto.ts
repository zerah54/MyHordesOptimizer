/** Réglages de l'attaque d'un jour, partagés par la ville (null = valeur par défaut). */
export interface AttackSettingsDTO {
    souls: number | null;
    spaLevel: number | null;
    fireworks: boolean;
    /** En lecture : âmes appliquées quand `souls` est null (ignoré en écriture). */
    defaultSouls?: number;
    /** En lecture : niveau SPA appliqué quand `spaLevel` est null (ignoré en écriture). */
    defaultSpaLevel?: number;
    /** En lecture : true si les défauts viennent de la tour du jour attaqué, false du planificateur de la veille. */
    defaultFromTdg?: boolean;
}

/** Paramètres du jour d'attaque construits par l'API (RefinerParams sans soul_attack). */
export interface RefinementParamsDTO {
    baseLoRand: number;
    baseHiRand: number;
    offSum: number;
    protect: number;
    blocks: number;
    soulTdg: number[];
    soulPlanif: number[];
    shiftSpan: number;
    shiftSteps: number;
    minGlobal: number;
    maxGlobal: number;
    reboundPossible: boolean;
    fireworks: boolean;
}

/** Entrées d'un scan : renvoyées telles quelles à l'API avec les seeds trouvés. */
export interface RefinementInputDTO {
    observed: number[];
    observedPlanif: number[] | null;
    params: RefinementParamsDTO;
}

export type RefinementStatus = 'None' | 'Valid' | 'Invalid';

/** Auteur d'un affinage. */
export interface RefinementAuthorDTO {
    userName: string;
    updateTime: string;
}

/** Affinage partagé d'un jour d'attaque : la plage, jamais les seeds. */
export interface RefinementViewDTO {
    status: RefinementStatus;
    attackMin: number | null;
    attackMax: number | null;
    reductionMin: number | null;
    reductionMax: number | null;
    noCompatibleConfiguration: boolean;
    lastUpdateInfo: RefinementAuthorDTO | null;
}
