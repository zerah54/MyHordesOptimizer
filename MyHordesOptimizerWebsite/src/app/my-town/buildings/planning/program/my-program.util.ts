import { CitizenCapacity } from '../budget.util';
import { StepResult } from '../building-progress.util';
import { BuildingPlanContentDTO, isBuildingStep, PlanCitizenDTO, PlanItemDTO, PlanPool, PlanTaskDTO } from '../plan.types';
import { CitizenRef, DayEvaluation } from '../plan-evaluation.util';

/** Avertissement affiché sur « Mon programme ». */
export type MyProgramNotice = 'pairs' | 'banned-forbidden' | 'over-committed';

/** Élément du programme d'un citoyen : étape évaluée ou consigne, dans l'ordre de sa section. */
export type MyProgramItem = { kind: 'step'; result: StepResult } | { kind: 'instruction'; text: string };

/** Ce qu'un citoyen doit faire un jour donné, extrait de l'évaluation du plan. */
export interface MyProgram {
    citizen: CitizenRef;
    capacity: CitizenCapacity;
    expeditionPa: number;
    tasks: PlanTaskDTO[];
    steps: StepResult[];
    items: MyProgramItem[];
    dayInstructions: string | null;
    /** Chantier à voter ce soir, nul sans consigne de vote. */
    voteBuildingId: number | null;
    /** Second chantier à voter ce soir (Brasier Sacrificiel construit), nul sinon. */
    secondVoteBuildingId: number | null;
    notices: MyProgramNotice[];
}

/**
 * Programme d'un citoyen : ses tâches, sa capacité, les consignes du jour et les éléments de sa poche
 * (réparations et consignes seules pour un banni sans BDE).
 * @param {number | null} user_id Identifiant du joueur ; nul s'il n'est pas connecté.
 * @param {BuildingPlanContentDTO} content Contenu de la proposition.
 * @param {DayEvaluation} evaluation Évaluation du jour.
 * @param {CitizenRef[]} citizens Citoyens vivants de la ville.
 * @returns {MyProgram | null} Programme, ou nul si le joueur n'est pas un citoyen vivant de la ville.
 */
export function myProgram(user_id: number | null, content: BuildingPlanContentDTO, evaluation: DayEvaluation, citizens: CitizenRef[]): MyProgram | null {
    const citizen: CitizenRef | undefined = citizens.find((candidate: CitizenRef): boolean => candidate.userId === user_id);
    const capacity: CitizenCapacity | undefined = evaluation.capacities.find((candidate: CitizenCapacity): boolean => candidate.userId === user_id);
    if (user_id === null || citizen === undefined || capacity === undefined) {
        return null;
    }
    const pool: PlanPool = citizen.banned ? 'banned' : 'regular';
    const build_forbidden: boolean = citizen.banned && !evaluation.hasSlavery;
    const notices: MyProgramNotice[] = [];
    if (citizen.banned) {
        notices.push(evaluation.hasSlavery ? 'pairs' : 'banned-forbidden');
    }
    if (capacity.overCommitted) {
        notices.push('over-committed');
    }
    const items: MyProgramItem[] = poolItems(content, evaluation, pool, build_forbidden);
    const day_instructions: string = (content.instructions ?? '').trim();
    return {
        citizen,
        capacity,
        expeditionPa: evaluation.expeditionPa.get(user_id) ?? 0,
        tasks: content.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks ?? [],
        steps: items.flatMap((item: MyProgramItem): StepResult[] => (item.kind === 'step' ? [item.result] : [])),
        items,
        dayInstructions: day_instructions === '' ? null : day_instructions,
        voteBuildingId: content.eveningVoteBuildingId,
        secondVoteBuildingId: evaluation.secondVote === null ? null : (content.eveningSecondVoteBuildingId ?? null),
        notices
    };
}

/**
 * Éléments d'une poche dans l'ordre : étapes évaluées (réparations seules si la construction est interdite) et consignes non vides.
 * @param {BuildingPlanContentDTO} content Contenu de la proposition.
 * @param {DayEvaluation} evaluation Évaluation du jour.
 * @param {PlanPool} pool Poche du citoyen.
 * @param {boolean} build_forbidden Vrai pour un banni sans BDE.
 * @returns {MyProgramItem[]} Éléments.
 */
function poolItems(content: BuildingPlanContentDTO, evaluation: DayEvaluation, pool: PlanPool, build_forbidden: boolean): MyProgramItem[] {
    const items: MyProgramItem[] = [];
    content.programs[pool].forEach((item: PlanItemDTO, index: number): void => {
        if (!isBuildingStep(item)) {
            if (item.text.trim() !== '') {
                items.push({ kind: 'instruction', text: item.text.trim() });
            }
            return;
        }
        const result: StepResult | undefined = evaluation.results.find((candidate: StepResult): boolean => candidate.pool === pool && candidate.index === index);
        if (result !== undefined && (!build_forbidden || result.step.kind === 'repair')) {
            items.push({ kind: 'step', result });
        }
    });
    return items;
}
