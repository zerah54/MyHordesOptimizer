import { TECHNICIAN_CP } from './budget.util';
import { budgetBreakdown, BudgetRow } from './budget-breakdown.util';
import { BuildingPlanContentDTO, emptyPlanContent, PlanPool } from './plan.types';
import { DayEvaluation } from './plan-evaluation.util';
import { FAKE_CITIZENS, fakeEvaluation } from './planning.store.fake';

/**
 * Alice (régulière) fouille 2 fois les déchets, Bob (banni) a une consigne libre, Chloé (technicienne) monte sa maison ;
 * une ligne ville côté bannis.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        basePa: 10,
        townLines: [{ label: 'Rab', pool: 'banned', pa: 5 }],
        citizens: [
            { userId: 1, tasks: [{ kind: 'action', ref: 'trash', count: 2, pa: 2 }] },
            { userId: 2, tasks: [{ kind: 'free', label: 'Veiller', pa: 3 }] },
            { userId: 3, tasks: [{ kind: 'home', level: 2, pa: 4 }] }
        ]
    };
}

/**
 * Ligne d'une catégorie.
 * @param {BudgetRow[]} rows Ventilation.
 * @param {string} category Catégorie.
 * @returns {BudgetRow | undefined} Ligne, absente si omise.
 */
function rowOf(rows: BudgetRow[], category: string): BudgetRow | undefined {
    return rows.find((row: BudgetRow): boolean => row.category === category);
}

describe('budgetBreakdown', (): void => {
    it('la somme des lignes égale le reste de chaque poche', (): void => {
        const plan: BuildingPlanContentDTO = content();
        const evaluation: DayEvaluation = fakeEvaluation(plan, { expeditionPa: new Map<number, number>([[1, 3]]) });
        const rows: BudgetRow[] = budgetBreakdown(plan, FAKE_CITIZENS, evaluation);
        const pools: PlanPool[] = ['banned', 'regular'];

        for (const pool of pools) {
            expect(rows.reduce((sum: number, row: BudgetRow): number => sum + row.pa[pool], 0)).toBe(evaluation.budgets[pool].remaining);
        }
        expect(rowOf(rows, 'basePa')?.pa).toEqual({ banned: 10, regular: 20 });
        expect(rowOf(rows, 'expeditions')?.pa).toEqual({ banned: 0, regular: -3 });
        expect(rowOf(rows, 'home')?.pa).toEqual({ banned: 0, regular: -4 });
        expect(rowOf(rows, 'free')?.pa).toEqual({ banned: -3, regular: 0 });
        expect(rowOf(rows, 'townLines')?.pa).toEqual({ banned: 5, regular: 0 });
    });

    it('Fouiller les déchets a sa ligne d\'action ; une ligne vide dans les deux poches est omise', (): void => {
        const plan: BuildingPlanContentDTO = content();
        const rows: BudgetRow[] = budgetBreakdown(plan, FAKE_CITIZENS, fakeEvaluation(plan));

        expect(rowOf(rows, 'action:trash')?.pa).toEqual({ banned: 0, regular: -2 });
        expect(rowOf(rows, 'homeUpgrade')).toBeUndefined();
        expect(rowOf(rows, 'overCommitted')).toBeUndefined();
    });

    it('PC du technicien comptés dans sa poche', (): void => {
        const plan: BuildingPlanContentDTO = content();
        const rows: BudgetRow[] = budgetBreakdown(plan, FAKE_CITIZENS, fakeEvaluation(plan));

        expect(rowOf(rows, 'technicianCp')?.pa).toEqual({ banned: 0, regular: TECHNICIAN_CP });
    });

    it('citoyen surengagé : ligne de dépassement positive, somme toujours juste', (): void => {
        const plan: BuildingPlanContentDTO = content();
        const evaluation: DayEvaluation = fakeEvaluation(plan, { expeditionPa: new Map<number, number>([[1, 25]]) });
        const rows: BudgetRow[] = budgetBreakdown(plan, FAKE_CITIZENS, evaluation);

        expect(rowOf(rows, 'overCommitted')?.pa).toEqual({ banned: 0, regular: 17 });
        expect(rows.reduce((sum: number, row: BudgetRow): number => sum + row.pa.regular, 0)).toBe(evaluation.budgets.regular.remaining);
    });
});
