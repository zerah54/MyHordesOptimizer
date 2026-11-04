import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { TECHNICIAN_CP } from './budget.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanPool, PlanTaskDTO } from './plan.types';
import { CitizenRef, DayEvaluation } from './plan-evaluation.util';

/** Catégorie d'une ligne de la ventilation du budget. */
export type BudgetCategory = 'basePa' | 'expeditions' | 'technicianCp' | 'program' | 'home' | 'homeUpgrade' | `action:${string}` | 'free' | 'townLines' | 'overCommitted';

/** Ligne de la ventilation : PA apportés (positifs) ou dépensés (négatifs) par poche. */
export interface BudgetRow {
    category: BudgetCategory;
    pa: Record<PlanPool, number>;
}

/**
 * Ventilation du budget de la journée par poche : PA de base, expéditions, PC du technicien, puis dépenses (programme, maisons,
 * actions, consignes libres), lignes de la ville et PA qu'un citoyen surengagé ne peut pas fournir ; la somme de chaque poche
 * égale son reste. Une ligne nulle dans les deux poches est omise, sauf les PA de base.
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {readonly CitizenRef[]} citizens Citoyens retenus dans le budget.
 * @param {DayEvaluation} evaluation Évaluation de la journée.
 * @returns {BudgetRow[]} Lignes, dans l'ordre d'affichage.
 */
export function budgetBreakdown(content: BuildingPlanContentDTO, citizens: readonly CitizenRef[], evaluation: DayEvaluation): BudgetRow[] {
    const rows: Map<BudgetCategory, Record<PlanPool, number>> = new Map<BudgetCategory, Record<PlanPool, number>>();
    const add = (category: BudgetCategory, pool: PlanPool, pa: number): void => {
        const row: Record<PlanPool, number> = rows.get(category) ?? { banned: 0, regular: 0 };
        row[pool] += pa;
        rows.set(category, row);
    };

    rows.set('basePa', { banned: 0, regular: 0 });
    for (const citizen of citizens) {
        const pool: PlanPool = citizen.banned ? 'banned' : 'regular';
        const entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === citizen.userId);
        add('basePa', pool, entry?.basePaOverride ?? content.basePa);
        add('expeditions', pool, -(evaluation.expeditionPa.get(citizen.userId) ?? 0));
        add('technicianCp', pool, citizen.technician ? TECHNICIAN_CP : 0);
    }
    const pools: PlanPool[] = ['banned', 'regular'];
    for (const pool of pools) {
        add('program', pool, -evaluation.budgets[pool].cost);
    }
    for (const citizen of citizens) {
        const pool: PlanPool = citizen.banned ? 'banned' : 'regular';
        const tasks: PlanTaskDTO[] = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === citizen.userId)?.tasks ?? [];
        for (const task of tasks) {
            add(taskCategory(task), pool, -task.pa);
        }
    }
    for (const pool of pools) {
        add('townLines', pool, evaluation.budgets[pool].lines);
    }

    const ordered: BudgetRow[] = orderRows(rows);
    const correction: Record<PlanPool, number> = { banned: 0, regular: 0 };
    for (const pool of pools) {
        const total: number = ordered.reduce((sum: number, row: BudgetRow): number => sum + row.pa[pool], 0);
        correction[pool] = evaluation.budgets[pool].remaining - total;
    }
    const all: BudgetRow[] = [...ordered, { category: 'overCommitted', pa: correction }];
    return all.filter((row: BudgetRow): boolean => row.category === 'basePa' || row.pa.banned !== 0 || row.pa.regular !== 0);
}

/**
 * Catégorie de dépense d'une consigne.
 * @param {PlanTaskDTO} task Consigne.
 * @returns {BudgetCategory} Catégorie.
 */
function taskCategory(task: PlanTaskDTO): BudgetCategory {
    if (task.kind === 'action' && task.ref !== undefined && task.ref !== null) {
        return `action:${task.ref}`;
    }
    return task.kind === 'action' ? 'free' : task.kind;
}

/**
 * Lignes dans l'ordre d'affichage : apports, programme, maisons, actions dans l'ordre du référentiel (inconnues ensuite), libres, lignes de la ville.
 * @param {ReadonlyMap<BudgetCategory, Record<PlanPool, number>>} rows Lignes par catégorie.
 * @returns {BudgetRow[]} Lignes ordonnées.
 */
function orderRows(rows: ReadonlyMap<BudgetCategory, Record<PlanPool, number>>): BudgetRow[] {
    const actions: BudgetCategory[] = DailyActionEnum.getAllValues<DailyActionEnum>().map((action: DailyActionEnum): BudgetCategory => `action:${action.key}`);
    const known: BudgetCategory[] = ['basePa', 'expeditions', 'technicianCp', 'program', 'home', 'homeUpgrade', ...actions];
    const unknown_actions: BudgetCategory[] = Array.from(rows.keys())
        .filter((category: BudgetCategory): boolean => category.startsWith('action:') && !known.includes(category));
    const categories: BudgetCategory[] = [...known, ...unknown_actions, 'free', 'townLines'];
    return categories
        .filter((category: BudgetCategory): boolean => rows.has(category))
        .map((category: BudgetCategory): BudgetRow => ({ category, pa: rows.get(category) as Record<PlanPool, number> }));
}
