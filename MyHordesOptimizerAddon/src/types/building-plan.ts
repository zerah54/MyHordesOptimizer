import type { I18nLabel } from './index';

export type PlanPool = 'banned' | 'regular';
export type PlanStepKind = 'build' | 'repair';
export type PlanStepMode = 'finish' | 'leave' | 'survive';
export type PlanTaskKind = 'home' | 'homeUpgrade' | 'action' | 'free';

export interface PlanStep {
    buildingId: number;
    kind: PlanStepKind;
    mode?: PlanStepMode | null;
    targetRemaining: number;
    note?: string | null;
}

export interface PlanInstruction {
    kind: 'instruction';
    text: string;
}

export type PlanItem = PlanStep | PlanInstruction;

export interface PlanTask {
    id?: string | null;
    kind: PlanTaskKind;
    ref?: string | null;
    level?: number | null;
    count?: number | null;
    label?: string | null;
    pa: number;
}

/** Contenu d'un plan : seuls les champs lus par le script. */
export interface PlanContent {
    eveningVoteBuildingId: number | null;
    eveningSecondVoteBuildingId?: number | null;
    citizens: { userId: number; tasks: PlanTask[] }[];
    programs: { banned: PlanItem[]; regular: PlanItem[] };
    instructions: string | null;
}

export interface ApiBuildingPlan {
    id: number;
    day: number;
    isEffective: boolean;
    content: PlanContent;
}

export interface ApiBuildingPlans {
    access: { isCitizen: boolean };
    plans: ApiBuildingPlan[];
}

export interface TownBuildingState {
    buildingId: number;
    isBuilt: boolean;
    apRemaining: number | null;
    life: number | null;
    maxLife: number | null;
}

export interface ApiBuildingRef {
    id: number;
    uid: string;
    label: I18nLabel;
    maxLife: number;
}
