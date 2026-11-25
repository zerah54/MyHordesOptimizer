import { BuildingPlanDTO, PlanItemDTO, PlanStepDTO } from '../buildings/planning/plan.types';

const ROUND_PATH_UID: string = 'small_round_path_#00';
/** Brasier Sacrificiel : un second chantier évolue chaque nuit. */
const PYRE_UID: string = 'small_pyre_#00';
const ROUND_PATH_MAX_LEVEL: number = 3;

/** Chantiers au soir du jour de la veille d'après les propositions de Chantiers. */
export interface PlannedBuildings {
    built_uids: ReadonlySet<string>;
    round_path_level: number;
    /** Proposition retenue pour le jour de la veille, nulle s'il n'en a aucune. */
    plan_id: number | null;
}

/** État réel de la ville. */
export interface RealBuildings {
    built_uids: readonly string[];
    round_path_level: number;
}

/**
 * Chantiers au soir d'un jour à venir : tout chantier d'un programme est supposé construit ; l'évolution votée le soir
 * s'applique avant l'attaque (une par nuit et par chantier, comme le jeu). Propositions : l'effective des jours
 * précédents (rien sans elle) ; pour le jour visé, la choisie, sinon l'effective, sinon la première.
 * @param {readonly BuildingPlanDTO[]} plans Propositions de Chantiers de la ville.
 * @param {ReadonlyMap<number, string>} uids Uid de chaque chantier, par identifiant.
 * @param {RealBuildings} real État réel de la ville.
 * @param {number} current_day Jour courant.
 * @param {number} target_day Jour de la veille.
 * @param {number | null} plan_id Proposition choisie pour le jour visé.
 * @returns {PlannedBuildings | null} Nul pour un jour passé.
 */
export function plannedBuildings(plans: readonly BuildingPlanDTO[], uids: ReadonlyMap<number, string>, real: RealBuildings, current_day: number,
                                 target_day: number, plan_id: number | null): PlannedBuildings | null {
    if (target_day < current_day) {
        return null;
    }
    const of_target: BuildingPlanDTO[] = plans.filter((plan: BuildingPlanDTO): boolean => plan.day === target_day);
    const target: BuildingPlanDTO | undefined = of_target.find((plan: BuildingPlanDTO): boolean => plan.id === plan_id)
        ?? of_target.find((plan: BuildingPlanDTO): boolean => plan.isEffective) ?? of_target[0];
    const built: Set<string> = new Set<string>(real.built_uids);
    let round_path_level: number = real.round_path_level;
    for (let day: number = current_day; day <= target_day; day++) {
        const plan: BuildingPlanDTO | undefined = day === target_day
            ? target
            : plans.find((candidate: BuildingPlanDTO): boolean => candidate.day === day && candidate.isEffective);
        if (plan === undefined) {
            continue;
        }
        const content: BuildingPlanDTO['content'] = plan.content;
        [...content.programs.regular, ...content.programs.banned]
            .filter((item: PlanItemDTO): item is PlanStepDTO => 'buildingId' in item && item.kind === 'build')
            .forEach((step: PlanStepDTO): void => {
                const uid: string | undefined = uids.get(step.buildingId);
                if (uid !== undefined) {
                    built.add(uid);
                }
            });
        const votes: (number | null | undefined)[] = [content.eveningVoteBuildingId, built.has(PYRE_UID) ? content.eveningSecondVoteBuildingId : null];
        const round_path_voted: boolean = votes.some((id: number | null | undefined): boolean => id !== null && id !== undefined && uids.get(id) === ROUND_PATH_UID);
        if (round_path_voted && built.has(ROUND_PATH_UID)) {
            round_path_level = Math.min(ROUND_PATH_MAX_LEVEL, round_path_level + 1);
        }
    }
    return { built_uids: built, round_path_level, plan_id: target?.id ?? null };
}
