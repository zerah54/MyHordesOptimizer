import { minimumSafeLife } from './night-survival.util';
import { isBuildingStep, PlanItemDTO, PlanPool, PlanProgramsDTO, PlanStepDTO, stepMode } from './plan.types';
import { repairHpPerAp, workshopCap } from './workshop.util';

/** Avancement d'un chantier de la ville : coût de base, PA déjà investis, état construit et PV/défense. */
export interface BuildingProgress {
    buildingId: number;
    paCurrent: number;
    invested: number;
    built: boolean;
    life: number;
    maxLife: number;
    def: number;
    defMax: number;
}

/** Problème détecté sur une étape de plan. */
export type StepIssue = 'unknown-building' | 'banned-cannot-build' | 'no-progress' | 'slavery-rounding' | 'already-built' | 'not-built' | 'parent-missing';

/** Contexte d'évaluation : niveau de l'atelier du jour, présence du Bureau des esclavagistes, pertes de PV la nuit. */
export interface StepContext {
    workshopLevel: number;
    hasSlavery: boolean;
    /** Perte de PV la nuit par chantier ; absent = 0. */
    nightLoss?: ReadonlyMap<number, number>;
    /** Parent de chaque chantier ; absent = pas de contrôle du parent. */
    parents?: ReadonlyMap<number, number | null>;
}

/** Résultat d'une étape évaluée. */
export interface StepResult {
    step: PlanStepDTO;
    pool: PlanPool;
    /** Rang de l'étape dans la liste de sa poche (consignes comprises). */
    index: number;
    points: number;
    paCost: number;
    remainingAfter: number;
    completes: boolean;
    issues: StepIssue[];
}

/** Résultat d'une étape avant numérotation. */
type StepOutcome = Omit<StepResult, 'index'>;

/**
 * Construit l'avancement initial d'un chantier à partir de l'état synchronisé.
 * @param {object} input Valeurs synchronisées ; `apRemaining` nul = chantier sans état (rien d'investi).
 * @returns {BuildingProgress} Avancement initial.
 */
export function initialProgress(input: {
    buildingId: number;
    paCurrent: number;
    apRemaining: number | null;
    isBuilt: boolean;
    life: number | null;
    maxLife: number | null;
    def: number | null;
    defMax: number;
}): BuildingProgress {
    const invested: number = input.apRemaining === null ? 0 : Math.max(0, input.paCurrent - input.apRemaining);
    return {
        buildingId: input.buildingId,
        paCurrent: input.paCurrent,
        invested,
        built: input.isBuilt,
        life: input.life ?? 0,
        maxLife: input.maxLife ?? 0,
        def: input.def ?? 0,
        defMax: input.defMax
    };
}

/**
 * PA restants à investir pour terminer un chantier, atelier compris.
 * @param {BuildingProgress} progress Avancement du chantier.
 * @param {number} workshopLevel Niveau de l'atelier.
 * @returns {number} PA restants (≥ 0), 0 si le chantier est construit.
 */
export function remainingAp(progress: BuildingProgress, workshopLevel: number): number {
    if (progress.built) {
        return 0;
    }
    return Math.max(0, workshopCap(progress.paCurrent, workshopLevel) - progress.invested);
}

/**
 * Évalue une étape de plan sur l'avancement d'un chantier, sans modifier celui-ci.
 * @param {PlanStepDTO} step Étape (construire ou réparer, avec la cible).
 * @param {PlanPool} pool Poche qui finance l'étape.
 * @param {BuildingProgress | undefined} progress Avancement du chantier, absent si le chantier est inconnu.
 * @param {StepContext} context Atelier et BDE.
 * @param {number} index Rang de l'étape dans sa poche.
 * @returns {{ result: StepResult; next: BuildingProgress | undefined }} Résultat et avancement après l'étape.
 */
export function evaluateStep(
    step: PlanStepDTO,
    pool: PlanPool,
    progress: BuildingProgress | undefined,
    context: StepContext,
    index: number = 0
): { result: StepResult; next: BuildingProgress | undefined } {
    if (progress === undefined) {
        return { result: { ...failure(step, pool, 0, ['unknown-building']), index }, next: undefined };
    }
    const outcome: { result: StepOutcome; next: BuildingProgress } = step.kind === 'repair'
        ? evaluateRepair(step, pool, progress, context)
        : evaluateBuild(step, pool, progress, context);
    return { result: { ...outcome.result, index }, next: outcome.next };
}

/**
 * Évalue un programme complet : les étapes des bannis d'abord, puis celles des non-bannis ; les consignes sont ignorées.
 * @param {PlanProgramsDTO} programs Programmes par poche.
 * @param {ReadonlyMap<number, BuildingProgress>} state Avancement des chantiers au début de la journée.
 * @param {StepContext} context Atelier et BDE.
 * @returns {{ results: StepResult[]; state: Map<number, BuildingProgress> }} Résultats dans l'ordre et état en fin de journée.
 */
export function evaluateProgram(
    programs: PlanProgramsDTO,
    state: ReadonlyMap<number, BuildingProgress>,
    context: StepContext
): { results: StepResult[]; state: Map<number, BuildingProgress> } {
    const current: Map<number, BuildingProgress> = new Map(state);
    const results: StepResult[] = [];
    const pools: PlanPool[] = ['banned', 'regular'];
    for (const pool of pools) {
        programs[pool].forEach((item: PlanItemDTO, index: number): void => {
            if (!isBuildingStep(item)) {
                return;
            }
            const own: BuildingProgress | undefined = current.get(item.buildingId);
            const evaluation: { result: StepResult; next: BuildingProgress | undefined } = own !== undefined && parentMissing(item, own, current, context)
                ? { result: { ...failure(item, pool, remainingAp(own, context.workshopLevel), ['parent-missing']), index }, next: undefined }
                : evaluateStep(item, pool, own, context, index);
            results.push(evaluation.result);
            if (evaluation.next !== undefined) {
                current.set(item.buildingId, evaluation.next);
            }
        });
    }
    return { results, state: current };
}

/**
 * Construction d'un chantier non construit dont le parent connu n'est pas (encore) construit.
 * @param {PlanStepDTO} step Étape.
 * @param {BuildingProgress} own Avancement du chantier de l'étape.
 * @param {ReadonlyMap<number, BuildingProgress>} current Avancement de tous les chantiers au moment de l'étape.
 * @param {StepContext} context Parents des chantiers.
 * @returns {boolean} Vrai si le parent manque.
 */
function parentMissing(step: PlanStepDTO, own: BuildingProgress, current: ReadonlyMap<number, BuildingProgress>, context: StepContext): boolean {
    const parent_id: number | null = context.parents?.get(step.buildingId) ?? null;
    if (step.kind !== 'build' || own.built || parent_id === null) {
        return false;
    }
    const parent: BuildingProgress | undefined = current.get(parent_id);
    return parent !== undefined && !parent.built;
}

/**
 * Résultat d'une étape refusée : aucun point, aucun PA, aucun changement.
 * @param {PlanStepDTO} step Étape.
 * @param {PlanPool} pool Poche.
 * @param {number} remaining Reste avant et après l'étape.
 * @param {StepIssue[]} issues Problèmes détectés.
 * @returns {StepOutcome} Résultat sans effet.
 */
function failure(step: PlanStepDTO, pool: PlanPool, remaining: number, issues: StepIssue[]): StepOutcome {
    return { step, pool, points: 0, paCost: 0, remainingAfter: remaining, completes: false, issues };
}

/**
 * Évalue une étape de construction.
 * @param {PlanStepDTO} step Étape.
 * @param {PlanPool} pool Poche.
 * @param {BuildingProgress} progress Avancement.
 * @param {StepContext} context Atelier et BDE.
 * @returns {{ result: StepOutcome; next: BuildingProgress }} Résultat et avancement suivant.
 */
function evaluateBuild(
    step: PlanStepDTO,
    pool: PlanPool,
    progress: BuildingProgress,
    context: StepContext
): { result: StepOutcome; next: BuildingProgress } {
    if (progress.built) {
        return { result: failure(step, pool, 0, ['already-built']), next: progress };
    }
    const remaining_before: number = remainingAp(progress, context.workshopLevel);
    if (remaining_before === 0) {
        // Coût déjà couvert (réduction d'atelier) : le chantier se termine sans PA.
        return {
            result: { step, pool, points: 0, paCost: 0, remainingAfter: 0, completes: true, issues: [] },
            next: { ...progress, built: true, life: progress.maxLife, def: progress.defMax }
        };
    }
    if (pool === 'banned' && !context.hasSlavery) {
        return { result: failure(step, pool, remaining_before, ['banned-cannot-build']), next: progress };
    }
    const target: number = stepMode(step) === 'leave' ? Math.max(0, step.targetRemaining) : 0;
    if (target >= remaining_before) {
        return { result: failure(step, pool, remaining_before, ['no-progress']), next: progress };
    }
    const points: number = remaining_before - target;
    const issues: StepIssue[] = [];
    let pa_cost: number = points;
    if (pool === 'banned') {
        pa_cost = Math.ceil((2 * points) / 3);
        if (points % 3 !== 0) {
            issues.push('slavery-rounding');
        }
    }
    const completes: boolean = target === 0;
    const next: BuildingProgress = {
        ...progress,
        invested: progress.invested + points,
        built: completes,
        life: completes ? progress.maxLife : progress.life,
        def: completes ? progress.defMax : progress.def
    };
    return { result: { step, pool, points, paCost: pa_cost, remainingAfter: target, completes, issues }, next };
}

/**
 * Évalue une étape de réparation ; la cible est le nombre de PV encore manquants après l'étape.
 * @param {PlanStepDTO} step Étape.
 * @param {PlanPool} pool Poche.
 * @param {BuildingProgress} progress Avancement.
 * @param {StepContext} context Atelier.
 * @returns {{ result: StepOutcome; next: BuildingProgress }} Résultat et avancement suivant.
 */
function evaluateRepair(
    step: PlanStepDTO,
    pool: PlanPool,
    progress: BuildingProgress,
    context: StepContext
): { result: StepOutcome; next: BuildingProgress } {
    if (!progress.built) {
        return { result: failure(step, pool, 0, ['not-built']), next: progress };
    }
    const missing_hp: number = Math.max(0, progress.maxLife - progress.life);
    const target: number = repairTargetMissing(step, progress, context);
    if (target >= missing_hp) {
        return { result: failure(step, pool, missing_hp, ['no-progress']), next: progress };
    }
    const hp_per_ap: number = repairHpPerAp(context.workshopLevel);
    const pa_cost: number = Math.ceil((missing_hp - target) / hp_per_ap);
    const life_after: number = Math.min(progress.maxLife, progress.life + pa_cost * hp_per_ap);
    const def_after: number = progress.maxLife > 0 ? Math.min(progress.defMax, Math.floor((progress.defMax * life_after) / progress.maxLife)) : progress.def;
    const next: BuildingProgress = { ...progress, life: life_after, def: def_after };
    const remaining_after: number = progress.maxLife - life_after;
    return {
        result: { step, pool, points: life_after - progress.life, paCost: pa_cost, remainingAfter: remaining_after, completes: remaining_after === 0, issues: [] },
        next
    };
}

/**
 * PV encore manquants visés après une réparation, selon le mode de l'étape.
 * @param {PlanStepDTO} step Étape de réparation.
 * @param {BuildingProgress} progress Avancement du chantier.
 * @param {StepContext} context Pertes de PV la nuit.
 * @returns {number} PV manquants visés (≥ 0).
 */
function repairTargetMissing(step: PlanStepDTO, progress: BuildingProgress, context: StepContext): number {
    switch (stepMode(step)) {
        case 'leave':
            return Math.max(0, step.targetRemaining);
        case 'survive':
            return Math.max(0, progress.maxLife - minimumSafeLife(progress.maxLife, context.nightLoss?.get(step.buildingId) ?? 0));
        default:
            return 0;
    }
}

/**
 * PV d'un chantier après une réparation de N PA.
 * @param {number} life PV avant la réparation.
 * @param {number} max_life PV max.
 * @param {number} pa PA investis (négatif = 0).
 * @param {number} workshop_level Niveau de l'atelier.
 * @returns {number} PV après, plafonnés aux PV max.
 */
export function repairLifeAfterPa(life: number, max_life: number, pa: number, workshop_level: number): number {
    return Math.min(max_life, life + Math.max(0, pa) * repairHpPerAp(workshop_level));
}

/**
 * PA nécessaires pour réparer un chantier jusqu'à N PV.
 * @param {number} life PV avant la réparation.
 * @param {number} target_life PV visés.
 * @param {number} workshop_level Niveau de l'atelier.
 * @returns {number} PA (≥ 0), arrondis au-dessus.
 */
export function repairPaFor(life: number, target_life: number, workshop_level: number): number {
    return Math.max(0, Math.ceil((target_life - life) / repairHpPerAp(workshop_level)));
}
