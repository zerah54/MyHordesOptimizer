import { repairPaFor, StepResult } from './building-progress.util';
import { DayEvaluation } from './plan-evaluation.util';
import { PlanPool, PlanStepKind, ValidatedBudgetDTO } from './plan.types';

/** Écart d'une étape entre le budget validé et le plan actuel. */
export interface BudgetDiffStep {
    buildingId: number;
    kind: PlanStepKind;
    change: 'added' | 'removed' | 'changed';
    /** Coût actuel moins coût validé (PA). */
    delta: number;
}

/** Écart avec le budget validé : valeurs = actuel − validé. */
export interface BudgetDiff {
    pools: Record<PlanPool, { budget: number; cost: number; remaining: number }>;
    steps: BudgetDiffStep[];
}

/** Étape retenue pour le diff ; `invested` n'est connu que côté validé. */
type DiffEntry = ValidatedBudgetDTO['steps'][number];

/** Coût cumulé de toutes les étapes d'une même clé `chantier:nature`. */
interface KeyTotal {
    buildingId: number;
    kind: PlanStepKind;
    /** Poche de la première étape de la clé. */
    pool: PlanPool;
    invested: number;
    /** PV au moment de la validation (réparations). */
    life: number;
    paCost: number;
}

/**
 * Clé d'identité d'une étape.
 * @param {DiffEntry} entry Étape.
 * @returns {string} Clé `chantier:nature`.
 */
function keyOf(entry: DiffEntry): string {
    return `${entry.buildingId}:${entry.kind}`;
}

/**
 * Cumule le coût des étapes par clé `chantier:nature`.
 * @param {DiffEntry[]} entries Étapes.
 * @returns {Map<string, KeyTotal>} Total par clé.
 */
function totalsByKey(entries: DiffEntry[]): Map<string, KeyTotal> {
    const totals: Map<string, KeyTotal> = new Map<string, KeyTotal>();
    for (const entry of entries) {
        const total: KeyTotal | undefined = totals.get(keyOf(entry));
        if (total === undefined) {
            totals.set(keyOf(entry), { buildingId: entry.buildingId, kind: entry.kind, pool: entry.pool, invested: entry.invested, life: entry.life ?? 0, paCost: entry.paCost });
        } else {
            total.paCost += entry.paCost;
        }
    }
    return totals;
}

/**
 * Fige le budget et les étapes d'une évaluation.
 * @param {DayEvaluation} evaluation Évaluation du jour.
 * @param {string} now Date ISO de la validation.
 * @returns {ValidatedBudgetDTO} Budget validé.
 */
export function snapshotBudget(evaluation: DayEvaluation, now: string): ValidatedBudgetDTO {
    const pool_of: (pool: PlanPool) => { budget: number; cost: number } = (pool: PlanPool): { budget: number; cost: number } =>
        ({ budget: evaluation.budgets[pool].budget, cost: evaluation.budgets[pool].cost });
    return {
        validatedAt: now,
        pools: { banned: pool_of('banned'), regular: pool_of('regular') },
        steps: evaluation.results.map((result: StepResult): DiffEntry => {
            const entry: DiffEntry = {
                buildingId: result.step.buildingId,
                kind: result.step.kind,
                pool: result.pool,
                paCost: result.paCost,
                invested: evaluation.progressBefore.get(result.step.buildingId)?.invested ?? 0
            };
            return result.step.kind === 'repair' ? { ...entry, life: evaluation.progressBefore.get(result.step.buildingId)?.life ?? 0 } : entry;
        })
    };
}

/**
 * Compare le plan actuel au budget validé. Une construction dont le chantier est construit depuis la validation est écartée
 * des deux côtés ; pour un chantier encore en cours (ou une réparation), les PA investis (ou l'équivalent en PV réparés)
 * depuis la validation sont ajoutés au coût actuel (plafonnés au coût validé) : dépensés, ils ne sont ni recrédités ni présentés comme un écart.
 * @param {ValidatedBudgetDTO} baseline Budget validé.
 * @param {DayEvaluation} evaluation Évaluation actuelle.
 * @returns {BudgetDiff} Écarts par poche et par étape.
 */
export function budgetDiff(baseline: ValidatedBudgetDTO, evaluation: DayEvaluation): BudgetDiff {
    const is_live: (entry: DiffEntry) => boolean = (entry: DiffEntry): boolean =>
        !(entry.kind === 'build' && evaluation.progressBefore.get(entry.buildingId)?.built === true);
    const before: DiffEntry[] = baseline.steps.filter(is_live);
    const after: DiffEntry[] = evaluation.results
        .map((result: StepResult): DiffEntry => ({ buildingId: result.step.buildingId, kind: result.step.kind, pool: result.pool, paCost: result.paCost, invested: 0 }))
        .filter(is_live);
    const before_by_key: Map<string, KeyTotal> = totalsByKey(before);
    const after_by_key: Map<string, KeyTotal> = totalsByKey(after);

    const credit_by_pool: Record<PlanPool, number> = { banned: 0, regular: 0 };
    const credits: Map<string, number> = new Map<string, number>();
    for (const [key, old] of before_by_key) {
        if (old.kind === 'build') {
            const invested_now: number = evaluation.progressBefore.get(old.buildingId)?.invested ?? 0;
            const credit: number = Math.min(Math.max(0, invested_now - old.invested), old.paCost);
            credits.set(key, credit);
            credit_by_pool[old.pool] += credit;
        } else {
            const life_now: number = evaluation.progressBefore.get(old.buildingId)?.life ?? 0;
            const credit: number = Math.min(repairPaFor(old.life, life_now, evaluation.workshopLevel), old.paCost);
            credits.set(key, credit);
            credit_by_pool[old.pool] += credit;
        }
    }

    const total: (entries: DiffEntry[], pool: PlanPool) => number = (entries: DiffEntry[], pool: PlanPool): number =>
        entries.filter((entry: DiffEntry): boolean => entry.pool === pool).reduce((sum: number, entry: DiffEntry): number => sum + entry.paCost, 0);
    const pool_diff: (pool: PlanPool) => BudgetDiff['pools'][PlanPool] = (pool: PlanPool): BudgetDiff['pools'][PlanPool] => {
        const budget: number = evaluation.budgets[pool].budget - baseline.pools[pool].budget;
        const cost: number = total(after, pool) + credit_by_pool[pool] - total(before, pool);
        return { budget, cost, remaining: budget - cost };
    };

    const steps: BudgetDiffStep[] = [];
    for (const [key, now] of after_by_key) {
        const old: KeyTotal | undefined = before_by_key.get(key);
        const delta: number = now.paCost + (credits.get(key) ?? 0) - (old?.paCost ?? 0);
        if (old === undefined) {
            steps.push({ buildingId: now.buildingId, kind: now.kind, change: 'added', delta });
        } else if (delta !== 0) {
            steps.push({ buildingId: now.buildingId, kind: now.kind, change: 'changed', delta });
        }
    }
    for (const [key, old] of before_by_key) {
        const delta: number = (credits.get(key) ?? 0) - old.paCost;
        if (!after_by_key.has(key) && delta !== 0) {
            steps.push({ buildingId: old.buildingId, kind: old.kind, change: 'removed', delta });
        }
    }
    return { pools: { banned: pool_diff('banned'), regular: pool_diff('regular') }, steps };
}
