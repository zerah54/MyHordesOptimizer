import { BudgetLine, CitizenCapacity, citizenCapacity, PoolBudget, poolBudgets } from './budget.util';
import { BuildingProgress, evaluateProgram, remainingAp, StepResult } from './building-progress.util';
import { defenseGap, projectedDefense, rankByDefPerPa, RankCandidate, RankedCandidate } from './defense.util';
import { nightLifeLoss, ownNightLoss } from './night-survival.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanPool, PlanTaskDTO, PlanTownLineDTO } from './plan.types';
import { missingResources, ResourceCount, sumResources } from './resources.util';
import { freeThreshold } from './workshop.util';

/** Uid du chantier « Atelier ». */
export const WORKSHOP_UID: string = 'small_refine_#00';

/** Uid du chantier « Bureau des esclavagistes ». */
export const SLAVERY_UID: string = 'small_slave_#00';

/** Niveau maximal de l'atelier. */
const WORKSHOP_MAX_LEVEL: number = 5;

/** Chantier du référentiel, avec le coût retenu pour la ville (état synchronisé ou palier 0 du référentiel). */
export interface BuildingRef {
    id: number;
    uid: string;
    label: string;
    pa: number;
    defence: number;
    maxLife: number;
    temporary: boolean;
    breakable: boolean;
    parentId: number | null;
    resources: ResourceCount[];
}

/** Citoyen vivant pris en compte dans le budget. */
export interface CitizenRef {
    userId: number;
    name: string;
    banned: boolean;
    technician: boolean;
    homeLevel: number | null;
}

/** Niveau de maison du référentiel, ressources résolues en identifiants d'objets. */
export interface HomeLevelRef {
    level: number;
    label: string;
    def: number;
    ap: number;
    apUrbanism: number;
    resources: ResourceCount[];
}

/** Tout ce qu'il faut pour évaluer une journée de plan. */
export interface DayInput {
    content: BuildingPlanContentDTO;
    buildings: ReadonlyMap<number, BuildingRef>;
    progress: ReadonlyMap<number, BuildingProgress>;
    workshopLevel: number;
    hasSlavery: boolean;
    citizens: CitizenRef[];
    expeditionPa: ReadonlyMap<number, number>;
    bank: ReadonlyMap<number, number>;
    itemValues: ReadonlyMap<number, number>;
    attack: number | null;
    baseDefense: number;
    temporaryDefense: number;
    homes: ReadonlyMap<number, HomeLevelRef>;
    hardMode: boolean;
}

/** Résultat de l'évaluation d'une journée. */
export interface DayEvaluation {
    workshopLevel: number;
    hasSlavery: boolean;
    results: StepResult[];
    progressAfter: Map<number, BuildingProgress>;
    progressBefore: ReadonlyMap<number, BuildingProgress>;
    nightLoss: ReadonlyMap<number, number>;
    capacities: CitizenCapacity[];
    expeditionPa: ReadonlyMap<number, number>;
    budgets: Record<PlanPool, PoolBudget>;
    completedIds: number[];
    needs: Map<number, number>;
    missing: ResourceCount[];
    attack: number | null;
    target: number | null;
    projectedDefense: number;
    defenseGap: number | null;
    freeThresholds: Map<number, number>;
    ranking: RankedCandidate[];
}

/** Valeurs qui se reportent d'un jour au suivant. */
type CarriedState = Pick<DayInput, 'progress' | 'workshopLevel' | 'hasSlavery' | 'baseDefense' | 'temporaryDefense'>;

/**
 * Évalue une journée de plan : étapes, budget par poche, ressources, défense projetée, seuils gratuits et classement.
 * @param {DayInput} input Contenu du plan et état de la ville au début de la journée.
 * @returns {DayEvaluation} Résultats de la journée.
 */
export function evaluateDay(input: DayInput): DayEvaluation {
    const content: BuildingPlanContentDTO = input.content;
    const night_loss: Map<number, number> = new Map<number, number>();
    const parents: Map<number, number | null> = new Map<number, number | null>();
    input.buildings.forEach((building: BuildingRef, id: number): void => {
        night_loss.set(id, nightLifeLoss(building, input.hardMode));
        parents.set(id, building.parentId);
    });
    const { results, state: progress_after }: { results: StepResult[]; state: Map<number, BuildingProgress> } = evaluateProgram(
        content.programs,
        input.progress,
        { workshopLevel: input.workshopLevel, hasSlavery: input.hasSlavery, nightLoss: night_loss, parents }
    );

    const capacities: CitizenCapacity[] = input.citizens.map((citizen: CitizenRef): CitizenCapacity => {
        const entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === citizen.userId);
        return citizenCapacity({
            userId: citizen.userId,
            banned: citizen.banned,
            technician: citizen.technician,
            basePa: entry?.basePaOverride ?? content.basePa,
            expeditionPa: input.expeditionPa.get(citizen.userId) ?? 0,
            taskPa: (entry?.tasks ?? []).reduce((sum: number, task: PlanTaskDTO): number => sum + task.pa, 0)
        });
    });
    const lines: BudgetLine[] = content.townLines.map((line: PlanTownLineDTO): BudgetLine => ({ pool: line.pool, pa: line.pa }));
    const budgets: Record<PlanPool, PoolBudget> = poolBudgets(capacities, lines, {
        banned: costOf(results, 'banned'),
        regular: costOf(results, 'regular')
    });

    const completed_ids: number[] = results
        .filter((result: StepResult): boolean => result.completes && result.step.kind === 'build')
        .map((result: StepResult): number => result.step.buildingId);
    const home_tasks: { citizen: CitizenRef | undefined; level: number }[] = homeTasks(content, input.citizens);
    const needs: Map<number, number> = sumResources([
        ...completed_ids.map((id: number): ResourceCount[] => input.buildings.get(id)?.resources ?? []),
        ...home_tasks.map((task: { citizen: CitizenRef | undefined; level: number }): ResourceCount[] => input.homes.get(task.level)?.resources ?? [])
    ]);

    const completed_def: number = completed_ids.reduce((sum: number, id: number): number => sum + (input.buildings.get(id)?.defence ?? 0), 0);
    const projected: number = projectedDefense({
        baseDefense: input.baseDefense,
        completedBuildingsDef: completed_def,
        repairsDef: repairsDefense(results, input.progress, progress_after),
        homesDef: homesDefense(home_tasks, input.homes),
        sources: content.defenseSources.map((source: { def: number; qty: number }): { def: number; qty: number } => ({ def: source.def, qty: source.qty }))
    });
    const attack: number | null = content.attackOverride ?? input.attack;

    return {
        workshopLevel: input.workshopLevel,
        hasSlavery: input.hasSlavery,
        results,
        progressAfter: progress_after,
        progressBefore: input.progress,
        nightLoss: night_loss,
        capacities,
        expeditionPa: input.expeditionPa,
        budgets,
        completedIds: completed_ids,
        needs,
        missing: missingResources(needs, input.bank),
        attack,
        target: attack === null ? null : attack - content.allowedOverflow,
        projectedDefense: projected,
        defenseGap: attack === null ? null : defenseGap(attack, content.allowedOverflow, projected),
        freeThresholds: freeThresholds(input),
        ranking: rankByDefPerPa(rankCandidates(input), input.itemValues)
    };
}

/**
 * Valeurs à reporter au jour suivant : avancement, niveau d'atelier (vote du soir), BDE et défense de départ.
 * @param {DayEvaluation} evaluation Évaluation du jour qui se termine.
 * @param {DayInput} input Entrée du jour qui se termine.
 * @returns {CarriedState} État de départ du lendemain.
 */
export function advanceDay(evaluation: DayEvaluation, input: DayInput): CarriedState {
    const vote_id: number | null = input.content.eveningVoteBuildingId;
    const voted_workshop: boolean = vote_id !== null && input.buildings.get(vote_id)?.uid === WORKSHOP_UID;
    const slavery_built: boolean = Array.from(evaluation.progressAfter.values()).some(
        (progress: BuildingProgress): boolean => progress.built && input.buildings.get(progress.buildingId)?.uid === SLAVERY_UID
    );
    const completed_temporary_def: number = evaluation.completedIds.reduce(
        (sum: number, id: number): number => sum + (input.buildings.get(id)?.temporary === true ? (input.buildings.get(id)?.defence ?? 0) : 0),
        0
    );
    const night: { progress: Map<number, BuildingProgress>; defLost: number } = passNight(evaluation.progressAfter, input.buildings);
    return {
        progress: night.progress,
        workshopLevel: Math.min(WORKSHOP_MAX_LEVEL, input.workshopLevel + (voted_workshop ? 1 : 0)),
        hasSlavery: input.hasSlavery || slavery_built,
        baseDefense: evaluation.projectedDefense - (input.temporaryDefense + completed_temporary_def) - night.defLost,
        temporaryDefense: 0
    };
}

/**
 * Avancement au lever du jour suivant : les chantiers temporaires ont disparu, le réacteur et les feux d'artifice ont perdu
 * leurs PV propres (pire cas). Les dégâts aléatoires de l'attaque en Pandémonium ne sont pas projetés.
 * @param {ReadonlyMap<number, BuildingProgress>} progress Avancement en fin de journée.
 * @param {ReadonlyMap<number, BuildingRef>} buildings Chantiers.
 * @returns {{ progress: Map<number, BuildingProgress>; defLost: number }} Avancement du lendemain et défense perdue.
 */
function passNight(progress: ReadonlyMap<number, BuildingProgress>, buildings: ReadonlyMap<number, BuildingRef>): { progress: Map<number, BuildingProgress>; defLost: number } {
    const next: Map<number, BuildingProgress> = new Map<number, BuildingProgress>(progress);
    let def_lost: number = 0;
    progress.forEach((current: BuildingProgress, id: number): void => {
        const building: BuildingRef | undefined = buildings.get(id);
        if (building === undefined || !current.built) {
            return;
        }
        if (building.temporary) {
            next.set(id, { ...current, built: false, invested: 0, life: 0, def: 0 });
            return;
        }
        const loss: number = ownNightLoss(building.uid);
        if (loss === 0) {
            return;
        }
        const life: number = Math.max(0, current.life - loss);
        const def: number = life === 0 || current.maxLife <= 0 ? 0 : Math.round((current.defMax * life) / current.maxLife);
        def_lost += current.def - def;
        next.set(id, life === 0 ? { ...current, built: false, invested: 0, life: 0, def: 0 } : { ...current, life, def });
    });
    return { progress: next, defLost: def_lost };
}

/**
 * Évalue des journées consécutives : chaque jour part de l'état laissé par le précédent. Les entrées ne sont pas modifiées.
 * @param {DayInput[]} inputs Journées dans l'ordre ; seules celles du premier jour portent l'état initial.
 * @returns {DayEvaluation[]} Une évaluation par journée.
 */
export function evaluateDays(inputs: DayInput[]): DayEvaluation[] {
    const evaluations: DayEvaluation[] = [];
    let carried: CarriedState | null = null;
    for (const input of inputs) {
        const effective: DayInput = carried === null ? input : { ...input, ...carried, progress: withDayCosts(carried.progress, input.progress) };
        const evaluation: DayEvaluation = evaluateDay(effective);
        evaluations.push(evaluation);
        carried = advanceDay(evaluation, effective);
    }
    return evaluations;
}

/**
 * Avancement reporté, où un chantier non construit et sans PA investis reprend le coût calculé pour le jour (niveau de plan de sa proposition).
 * @param {ReadonlyMap<number, BuildingProgress>} carried Avancement de fin de veille.
 * @param {ReadonlyMap<number, BuildingProgress>} day Avancement calculé pour le jour.
 * @returns {Map<number, BuildingProgress>} Avancement de départ du jour.
 */
function withDayCosts(carried: ReadonlyMap<number, BuildingProgress>, day: ReadonlyMap<number, BuildingProgress>): Map<number, BuildingProgress> {
    const merged: Map<number, BuildingProgress> = new Map<number, BuildingProgress>(carried);
    carried.forEach((progress: BuildingProgress, id: number): void => {
        const own: BuildingProgress | undefined = day.get(id);
        if (own !== undefined && !progress.built && progress.invested === 0) {
            merged.set(id, { ...progress, paCurrent: own.paCurrent });
        }
    });
    return merged;
}

/**
 * Coût en PA des étapes d'une poche.
 * @param {StepResult[]} results Résultats des étapes.
 * @param {PlanPool} pool Poche.
 * @returns {number} Somme des PA dépensés.
 */
function costOf(results: StepResult[], pool: PlanPool): number {
    return results.filter((result: StepResult): boolean => result.pool === pool).reduce((sum: number, result: StepResult): number => sum + result.paCost, 0);
}

/**
 * Tâches « maison » du plan avec le citoyen concerné.
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {CitizenRef[]} citizens Citoyens connus.
 * @returns {{ citizen: CitizenRef | undefined; level: number }[]} Tâches de montée de niveau de maison.
 */
function homeTasks(content: BuildingPlanContentDTO, citizens: CitizenRef[]): { citizen: CitizenRef | undefined; level: number }[] {
    const tasks: { citizen: CitizenRef | undefined; level: number }[] = [];
    for (const entry of content.citizens) {
        for (const task of entry.tasks) {
            if (task.kind === 'home' && task.level !== undefined && task.level !== null) {
                tasks.push({ citizen: citizens.find((candidate: CitizenRef): boolean => candidate.userId === entry.userId), level: task.level });
            }
        }
    }
    return tasks;
}

/**
 * Défense gagnée par les montées de niveau de maison ; 0 quand le niveau actuel du citoyen est inconnu.
 * @param {{ citizen: CitizenRef | undefined; level: number }[]} tasks Tâches de maison.
 * @param {ReadonlyMap<number, HomeLevelRef>} homes Référentiel indexé par niveau.
 * @returns {number} Défense ajoutée.
 */
function homesDefense(tasks: { citizen: CitizenRef | undefined; level: number }[], homes: ReadonlyMap<number, HomeLevelRef>): number {
    let total: number = 0;
    for (const task of tasks) {
        const current_level: number | null = task.citizen?.homeLevel ?? null;
        const target: HomeLevelRef | undefined = homes.get(task.level);
        const current: HomeLevelRef | undefined = current_level === null ? undefined : homes.get(current_level);
        if (target !== undefined && current !== undefined) {
            total += Math.max(0, target.def - current.def);
        }
    }
    return total;
}

/**
 * Défense restaurée par les réparations de la journée.
 * @param {StepResult[]} results Résultats des étapes.
 * @param {ReadonlyMap<number, BuildingProgress>} before Avancement avant la journée.
 * @param {ReadonlyMap<number, BuildingProgress>} after Avancement après la journée.
 * @returns {number} Défense gagnée.
 */
function repairsDefense(results: StepResult[], before: ReadonlyMap<number, BuildingProgress>, after: ReadonlyMap<number, BuildingProgress>): number {
    const repaired: Set<number> = new Set<number>(
        results.filter((result: StepResult): boolean => result.step.kind === 'repair').map((result: StepResult): number => result.step.buildingId)
    );
    let total: number = 0;
    repaired.forEach((id: number): void => {
        total += Math.max(0, (after.get(id)?.def ?? 0) - (before.get(id)?.def ?? 0));
    });
    return total;
}

/**
 * Seuil gratuit des chantiers qui restent à construire.
 * @param {DayInput} input Entrée de la journée.
 * @returns {Map<number, number>} PA à laisser par chantier.
 */
function freeThresholds(input: DayInput): Map<number, number> {
    const thresholds: Map<number, number> = new Map<number, number>();
    input.progress.forEach((progress: BuildingProgress, id: number): void => {
        if (!progress.built && remainingAp(progress, input.workshopLevel) > 0) {
            thresholds.set(id, freeThreshold(progress.paCurrent, input.workshopLevel));
        }
    });
    return thresholds;
}

/**
 * Éléments comparés par le classement déf/PA : chantiers à construire, niveaux de maison, sources de défense.
 * @param {DayInput} input Entrée de la journée.
 * @returns {RankCandidate[]} Candidats à défense strictement positive.
 */
function rankCandidates(input: DayInput): RankCandidate[] {
    const candidates: RankCandidate[] = [];
    input.progress.forEach((progress: BuildingProgress, id: number): void => {
        const building: BuildingRef | undefined = input.buildings.get(id);
        if (building !== undefined && !progress.built && building.defence > 0) {
            candidates.push({ label: building.label, kind: 'building', def: building.defence, pa: remainingAp(progress, input.workshopLevel), resources: building.resources });
        }
    });
    input.homes.forEach((home: HomeLevelRef): void => {
        const gain: number = home.def - (input.homes.get(home.level - 1)?.def ?? 0);
        if (home.level >= 1 && gain > 0) {
            candidates.push({ label: home.label, kind: 'home', def: gain, pa: home.ap, resources: home.resources });
        }
    });
    for (const source of input.content.defenseSources) {
        if (source.def * source.qty > 0) {
            candidates.push({ label: source.label, kind: 'source', def: source.def * source.qty, pa: source.pa * source.qty, resources: [] });
        }
    }
    return candidates;
}
