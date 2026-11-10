import { ItemSummaryDTO } from './item-summary.dto';

/** Condition de chantier posée sur une action (construit ou non). */
export interface BuildingConditionDTO {
    buildingUid: string;
    built: boolean;
}

/** Issue possible d'une action sur un objet. */
export interface ActionOutcomeDTO {
    kind: 'Consumed' | 'Broken' | 'Transformed' | 'Produced' | 'Kill';
    /** Probabilité (0..1). */
    probability: number;
    item: ItemSummaryDTO | null;
    quantity: number | null;
    killMin: number | null;
    killMax: number | null;
}

/** Effets d'une action du jeu liée à un objet. */
export interface ItemActionEffectsDTO {
    actionName: string;
    kind: 'Open' | 'Slaughter' | 'Purify' | 'Attack' | 'Nightwatch';
    apCost: number | null;
    buildingCondition: BuildingConditionDTO | null;
    appliesToTown: boolean | null;
    /** Forme chargée de l'objet qui porte l'action, quand elle diffère. */
    viaLoadedForm: ItemSummaryDTO | null;
    outcomes: ActionOutcomeDTO[];
}

/** Nombre de charges obtenu au rechargement et sa probabilité (0..1). */
export interface ChargeChanceDTO {
    charges: number;
    probability: number;
}
