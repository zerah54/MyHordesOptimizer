import { CitizenCapacity, PoolBudget } from './budget.util';
import { StepIssue, StepResult } from './building-progress.util';
import { PlanPool } from './plan.types';
import { BuildingRef, CitizenRef, DayEvaluation } from './plan-evaluation.util';

/** Alerte d'un plan ; `pool` et `index` repèrent la ligne du programme concernée (nuls hors programme). */
export interface PlanAlert {
    text: string;
    pool: PlanPool | null;
    index: number | null;
}

/**
 * Texte d'un problème d'étape.
 * @param {StepIssue} issue Problème.
 * @returns {string} Texte traduit.
 */
export function stepIssueLabel(issue: StepIssue): string {
    switch (issue) {
        case 'banned-cannot-build':
            return $localize`Les bannis ne peuvent pas construire sans le Bureau des esclavagistes`;
        case 'no-progress':
            return $localize`La cible est déjà atteinte : rien à investir`;
        case 'slavery-rounding':
            return $localize`Investir par paires de PA : le rendement est réduit`;
        case 'already-built':
            return $localize`Chantier déjà construit`;
        case 'not-built':
            return $localize`Chantier pas encore construit`;
        case 'parent-missing':
            return $localize`Le chantier parent n'est pas construit`;
        case 'unknown-building':
            return $localize`Chantier inconnu`;
    }
}

/**
 * Carte de la page qui porte une alerte.
 * @param {PlanAlert} alert Alerte.
 * @returns {'program' | 'budget'} Budget hors programme, sinon Programme.
 */
export function alertCard(alert: PlanAlert): 'program' | 'budget' {
    return alert.pool === null ? 'budget' : 'program';
}

/**
 * Identifiant de l'élément du programme visé par une alerte.
 * @param {PlanAlert} alert Alerte.
 * @returns {string | null} Ligne, sinon section, nul hors programme.
 */
export function alertAnchor(alert: PlanAlert): string | null {
    if (alert.pool === null) {
        return null;
    }
    return alert.index === null ? `plan-section-${alert.pool}` : `plan-item-${alert.pool}-${alert.index}`;
}

/**
 * Alertes d'une journée : problèmes d'étapes, citoyens sur-engagés, poches au budget dépassé.
 * @param {DayEvaluation} evaluation Évaluation du jour.
 * @param {ReadonlyMap<number, BuildingRef>} buildings Chantiers (libellés).
 * @param {CitizenRef[]} citizens Citoyens (noms).
 * @param {boolean} show_pools Faux quand la poche des bannis est masquée : le dépassement ne nomme pas de poche.
 * @returns {PlanAlert[]} Alertes, dans l'ordre du programme puis citoyens puis poches.
 */
export function planAlerts(evaluation: DayEvaluation, buildings: ReadonlyMap<number, BuildingRef>, citizens: CitizenRef[], show_pools: boolean = true): PlanAlert[] {
    const alerts: PlanAlert[] = [];
    evaluation.results.forEach((result: StepResult): void => {
        const label: string = buildings.get(result.step.buildingId)?.label ?? `#${result.step.buildingId}`;
        result.issues.forEach((issue: StepIssue): void => {
            alerts.push({ text: `${label} : ${stepIssueLabel(issue)}`, pool: result.pool, index: result.index });
        });
    });
    evaluation.capacities.filter((capacity: CitizenCapacity): boolean => capacity.overCommitted).forEach((capacity: CitizenCapacity): void => {
        const name: string = citizens.find((citizen: CitizenRef): boolean => citizen.userId === capacity.userId)?.name ?? `#${capacity.userId}`;
        alerts.push({ text: `${name} : ${$localize`Consignes individuelles et expédition dépassent les PA de base`}`, pool: null, index: null });
    });
    const budgets: PoolBudget[] = [evaluation.budgets.regular, evaluation.budgets.banned];
    budgets.filter((budget: PoolBudget): boolean => budget.remaining < 0).forEach((budget: PoolBudget): void => {
        const overrun: number = -budget.remaining;
        const pool_text: string = budget.pool === 'regular'
            ? $localize`Non-bannis : budget dépassé de ${overrun}:overrun: PA`
            : $localize`Bannis : budget dépassé de ${overrun}:overrun: PA`;
        alerts.push({ text: show_pools ? pool_text : $localize`Budget dépassé de ${overrun}:overrun: PA`, pool: budget.pool, index: null });
    });
    return alerts;
}
