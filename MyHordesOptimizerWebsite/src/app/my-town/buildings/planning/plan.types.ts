/** Poche de budget : citoyens bannis ou non-bannis. */
export type PlanPool = 'banned' | 'regular';

/** Nature d'une étape : construire un chantier ou le réparer. */
export type PlanStepKind = 'build' | 'repair';

/** Nature d'une tâche personnelle. */
export type PlanTaskKind = 'home' | 'homeUpgrade' | 'action' | 'free';

/** Façon de traiter un chantier : terminer (ou réparer entièrement), laisser à une cible, réparer pour passer la nuit. */
export type PlanStepMode = 'finish' | 'leave' | 'survive';

/**
 * Étape d'un programme sur un chantier. En mode `leave`, `targetRemaining` = PA restants (construction)
 * ou PV manquants (réparation) après l'étape.
 */
export interface PlanStepDTO {
    buildingId: number;
    kind: PlanStepKind;
    mode?: PlanStepMode | null;
    targetRemaining: number;
    note?: string | null;
}

/** Consigne textuelle insérée dans un programme. */
export interface PlanInstructionDTO {
    kind: 'instruction';
    text: string;
}

/** Élément d'un programme : étape de chantier ou consigne. */
export type PlanItemDTO = PlanStepDTO | PlanInstructionDTO;

/** Consigne individuelle d'un citoyen et son coût : maison, amélioration (`ref` = clé `HomeEnum`), action de chantier (`ref` = clé d'action) ou libre. */
export interface PlanTaskDTO {
    /** Identifiant stable (clé des coches « fait »), unique pour un citoyen. */
    id?: string | null;
    kind: PlanTaskKind;
    ref?: string | null;
    level?: number | null;
    /** Action de chantier utilisable plusieurs fois par jour (fouilles des galeries du Fouineur) : utilisations prévues ; absent = une. */
    count?: number | null;
    label?: string | null;
    pa: number;
}

/** Saisies propres à un citoyen dans une proposition. */
export interface PlanCitizenDTO {
    userId: number;
    basePaOverride?: number | null;
    tasks: PlanTaskDTO[];
}

/** Ligne de budget de la ville : positive = PA ajoutés, négative = PA retirés. */
export interface PlanTownLineDTO {
    label: string;
    pool: PlanPool;
    pa: number;
}

/** Programmes de chantiers de chaque poche, dans l'ordre d'exécution. */
export interface PlanProgramsDTO {
    banned: PlanItemDTO[];
    regular: PlanItemDTO[];
}

/** Source de défense hors chantiers (objets défensifs, chiens, etc.). */
export interface PlanDefenseSourceDTO {
    label: string;
    pa: number;
    def: number;
    qty: number;
}

/** Perte prévue cette nuit : chantier laissé détruire (perdu dès le lendemain) ou bonus d'évolution perdu (la nuit même). */
export type PlanLossKind = 'destroyed' | 'bonus';

/** Perte prévue sur un chantier construit. */
export interface PlanLossDTO {
    buildingId: number;
    kind: PlanLossKind;
}

/** Contenu d'une proposition de plan. */
export interface BuildingPlanContentDTO {
    attackOverride: number | null;
    allowedOverflow: number;
    eveningVoteBuildingId: number | null;
    /** Second chantier voté le soir, compté seulement si le Brasier Sacrificiel est construit (absent des plans antérieurs). */
    eveningSecondVoteBuildingId?: number | null;
    /** Gestion des bannis activée à la main sur cette proposition. */
    manageBanned: boolean;
    basePa: number;
    citizens: PlanCitizenDTO[];
    townLines: PlanTownLineDTO[];
    programs: PlanProgramsDTO;
    defenseSources: PlanDefenseSourceDTO[];
    instructions: string | null;
    planTiers: Record<string, number>;
    /** Pertes prévues cette nuit ; absent dans une proposition enregistrée avant leur ajout. */
    losses?: PlanLossDTO[];
}

/** Proposition de plan d'un jour. */
export interface BuildingPlanDTO {
    id: number;
    day: number;
    name: string;
    isEffective: boolean;
    version: number;
    authorId: number;
    authorName: string | null;
    content: BuildingPlanContentDTO;
    lastUpdateInfo: unknown | null;
}

/** Droits de l'utilisateur sur les plans de la ville. */
export interface BuildingPlanAccessDTO {
    isCitizen: boolean;
    canEdit: boolean;
}

/** Réponse de lecture : propositions, valeurs d'objets (par identifiant) et version des réglages. */
export interface BuildingPlansDTO {
    access: BuildingPlanAccessDTO;
    plans: BuildingPlanDTO[];
    itemValues: Record<string, number>;
    settingsVersion: number;
}

/** Requête de création (sans `id`) ou de modification (avec `id` et `version`) d'une proposition. */
export interface BuildingPlanRequestDTO {
    id?: number | null;
    day: number;
    name: string;
    version?: number | null;
    content: BuildingPlanContentDTO;
}

/** Requête d'enregistrement des valeurs d'objets. */
export interface BuildingPlanSettingsRequestDTO {
    itemValues: Record<string, number>;
    version?: number | null;
}

/** Ressource requise par un chantier de la ville. */
export interface TownBuildingResourceDTO {
    itemId: number;
    count: number;
}

/** État synchronisé d'un chantier de la ville. */
export interface TownBuildingStateDTO {
    buildingId: number;
    isBuilt: boolean;
    paCurrent: number | null;
    apRemaining: number | null;
    life: number | null;
    maxLife: number | null;
    def: number | null;
    level: number | null;
    difficulty: number | null;
    resources: TownBuildingResourceDTO[];
}

/** Défense de la ville telle que rapportée par la dernière mise à jour des outils. */
export interface TownDefenseStateDTO {
    total: number | null;
    base: number | null;
    buildings: number | null;
    upgrades: number | null;
    items: number | null;
    itemsMul: number | null;
    citizenHomes: number | null;
    citizenGuardians: number | null;
    watchmen: number | null;
    souls: number | null;
    temp: number | null;
    cadavers: number | null;
    bonus: number | null;
}

/** État synchronisé de la ville : chantiers et défense. */
export interface BuildingPlanStateDTO {
    buildings: TownBuildingStateDTO[];
    defense: TownDefenseStateDTO | null;
}

/**
 * Contenu d'une proposition vide, aux valeurs par défaut de l'API.
 * @returns {BuildingPlanContentDTO} Contenu vide (19 PA de base).
 */
export function emptyPlanContent(): BuildingPlanContentDTO {
    return {
        attackOverride: null,
        allowedOverflow: 0,
        eveningVoteBuildingId: null,
        eveningSecondVoteBuildingId: null,
        manageBanned: false,
        basePa: 19,
        citizens: [],
        townLines: [],
        programs: { banned: [], regular: [] },
        defenseSources: [],
        instructions: null,
        planTiers: {},
        losses: []
    };
}

/**
 * Vrai pour une étape de chantier (construction ou réparation), faux pour une consigne.
 * @param {PlanItemDTO} item Élément du programme.
 * @returns {boolean} Vrai pour une étape de chantier.
 */
export function isBuildingStep(item: PlanItemDTO): item is PlanStepDTO {
    return item.kind !== 'instruction';
}

/**
 * Mode d'une étape ; une étape enregistrée avant les modes est déduite de sa cible.
 * @param {PlanStepDTO} step Étape.
 * @returns {PlanStepMode} Mode effectif.
 */
export function stepMode(step: PlanStepDTO): PlanStepMode {
    return step.mode ?? (step.targetRemaining === 0 ? 'finish' : 'leave');
}
