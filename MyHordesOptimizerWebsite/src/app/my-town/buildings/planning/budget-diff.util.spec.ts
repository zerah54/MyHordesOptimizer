import { budgetDiff, snapshotBudget } from './budget-diff.util';
import { BuildingProgress } from './building-progress.util';
import { DayEvaluation } from './plan-evaluation.util';
import { BuildingPlanContentDTO, emptyPlanContent, PlanItemDTO, PlanPool, PlanStepDTO } from './plan.types';
import { fakeEvaluation } from './planning.store.fake';

const WALL: PlanStepDTO = { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 };
const WORKSHOP: PlanStepDTO = { buildingId: 2, kind: 'build', mode: 'finish', targetRemaining: 0 };

/**
 * Contenu dont la poche donnée porte les étapes données.
 * @param {PlanItemDTO[]} steps Étapes.
 * @param {PlanPool} pool Poche.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(steps: PlanItemDTO[], pool: PlanPool = 'regular'): BuildingPlanContentDTO {
    const base: BuildingPlanContentDTO = emptyPlanContent();
    return { ...base, programs: { ...base.programs, [pool]: steps } };
}

describe('snapshotBudget', (): void => {
    it('fige budget, coût, étapes (avec poche) et date', (): void => {
        const evaluation: DayEvaluation = fakeEvaluation(content([WALL]));

        const snapshot = snapshotBudget(evaluation, '2026-11-13T10:00:00Z');

        expect(snapshot.validatedAt).toBe('2026-11-13T10:00:00Z');
        expect(snapshot.pools.regular).toEqual({ budget: evaluation.budgets.regular.budget, cost: evaluation.budgets.regular.cost });
        expect(snapshot.pools.banned.budget).toBe(evaluation.budgets.banned.budget);
        expect(snapshot.steps).toEqual([{ buildingId: 1, kind: 'build', pool: 'regular', paCost: 30, invested: 10 }]);
    });
});

describe('budgetDiff', (): void => {
    it('étape ajoutée de 30 PA : coût +30, reste -30, une étape added', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([])), 'x');

        const diff = budgetDiff(baseline, fakeEvaluation(content([WALL])));

        expect(diff.pools.regular).toEqual({ budget: 0, cost: 30, remaining: -30 });
        expect(diff.steps).toEqual([{ buildingId: 1, kind: 'build', change: 'added', delta: 30 }]);
    });

    it('étape retirée : une étape removed, coût négatif', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');

        const diff = budgetDiff(baseline, fakeEvaluation(content([])));

        expect(diff.pools.regular.cost).toBe(-30);
        expect(diff.pools.regular.remaining).toBe(30);
        expect(diff.steps).toEqual([{ buildingId: 1, kind: 'build', change: 'removed', delta: -30 }]);
    });

    it('étape dont le coût change : une étape changed avec le delta', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');
        const leave: PlanStepDTO = { ...WALL, mode: 'leave', targetRemaining: 10 };

        const diff = budgetDiff(baseline, fakeEvaluation(content([leave])));

        expect(diff.steps).toEqual([{ buildingId: 1, kind: 'build', change: 'changed', delta: -10 }]);
        expect(diff.pools.regular.cost).toBe(-10);
    });

    it('chantier construit depuis la validation : aucun effet sur le diff', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL, WORKSHOP])), 'x');
        const built: BuildingProgress = { buildingId: 1, paCurrent: 40, invested: 40, built: true, life: 30, maxLife: 30, def: 30, defMax: 30 };
        const progress: Map<number, BuildingProgress> = new Map<number, BuildingProgress>([
            [1, built],
            [2, { buildingId: 2, paCurrent: 20, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0 }],
            [3, { buildingId: 3, paCurrent: 10, invested: 10, built: true, life: 10, maxLife: 30, def: 5, defMax: 15 }]
        ]);

        const diff = budgetDiff(baseline, fakeEvaluation(content([WALL, WORKSHOP]), { progress }));

        expect(diff.steps).toEqual([]);
        expect(diff.pools.regular).toEqual({ budget: 0, cost: 0, remaining: 0 });
    });

    it('un changement de budget (ligne de ville) ne change pas le coût', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');
        const current: BuildingPlanContentDTO = { ...content([WALL]), townLines: [{ label: 'Guitare', pool: 'regular', pa: 5 }] };

        const diff = budgetDiff(baseline, fakeEvaluation(current));

        expect(diff.pools.regular).toEqual({ budget: 5, cost: 0, remaining: 5 });
        expect(diff.steps).toEqual([]);
    });

    it('étape de la poche des bannis : comptée dans la poche des bannis seulement', (): void => {
        const repair: PlanStepDTO = { buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 };
        const baseline = snapshotBudget(fakeEvaluation(content([], 'banned')), 'x');
        const current: DayEvaluation = fakeEvaluation(content([repair], 'banned'));
        const cost: number = current.budgets.banned.cost;

        const diff = budgetDiff(baseline, current);

        expect(cost).toBeGreaterThan(0);
        expect(diff.pools.banned.cost).toBe(cost);
        expect(diff.pools.regular.cost).toBe(0);
        expect(diff.steps).toEqual([{ buildingId: 3, kind: 'repair', change: 'added', delta: cost }]);
    });

    it('revalidation : le nouveau budget validé remplace la référence, diff nul', (): void => {
        const evaluation: DayEvaluation = fakeEvaluation(content([WALL]));

        const diff = budgetDiff(snapshotBudget(evaluation, 'y'), evaluation);

        expect(diff.steps).toEqual([]);
        expect(diff.pools.regular).toEqual({ budget: 0, cost: 0, remaining: 0 });
        expect(diff.pools.banned).toEqual({ budget: 0, cost: 0, remaining: 0 });
    });

    /**
     * Avancement de test où le mur a investi la valeur donnée.
     * @param {number} invested PA investis dans le mur.
     * @param {boolean} built Mur construit.
     * @returns {Map<number, BuildingProgress>} Avancement des chantiers de test.
     */
    function progress_with_wall(invested: number, built: boolean = false): Map<number, BuildingProgress> {
        return new Map<number, BuildingProgress>([
            [1, { buildingId: 1, paCurrent: 40, invested, built, life: 0, maxLife: 30, def: 0, defMax: 30 }],
            [2, { buildingId: 2, paCurrent: 20, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0 }],
            [3, { buildingId: 3, paCurrent: 10, invested: 10, built: true, life: 10, maxLife: 30, def: 5, defMax: 15 }]
        ]);
    }

    it('deux étapes sur le même chantier : la liste s\'additionne aux totaux de poche', (): void => {
        const leave: (target: number) => PlanStepDTO = (target: number): PlanStepDTO => ({ ...WALL, mode: 'leave', targetRemaining: target });
        const baseline = snapshotBudget(fakeEvaluation(content([leave(20), WALL])), 'x');

        const diff = budgetDiff(baseline, fakeEvaluation(content([leave(15), WALL])));

        expect(diff.pools.regular.cost).toBe(0);
        expect(diff.steps).toEqual([]);
    });

    it('PA investis depuis la validation : ni recrédités ni affichés comme un écart', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');
        expect(baseline.steps[0].invested).toBe(10);

        const diff = budgetDiff(baseline, fakeEvaluation(content([WALL]), { progress: progress_with_wall(30) }));

        expect(diff.steps).toEqual([]);
        expect(diff.pools.regular).toEqual({ budget: 0, cost: 0, remaining: 0 });
    });

    it('investir plus que le coût validé ne rend jamais le coût négatif au-delà de la base', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');

        const diff = budgetDiff(baseline, fakeEvaluation(content([WALL]), { progress: progress_with_wall(39) }));

        expect(diff.pools.regular.cost).toBe(0);
        expect(diff.steps).toEqual([]);
    });

    it('progression et modification du plan : seul le vrai changement du plan apparaît', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');
        const leave: PlanStepDTO = { ...WALL, mode: 'leave', targetRemaining: 5 };

        const diff = budgetDiff(baseline, fakeEvaluation(content([leave]), { progress: progress_with_wall(30) }));

        expect(diff.steps).toEqual([{ buildingId: 1, kind: 'build', change: 'changed', delta: -5 }]);
        expect(diff.pools.regular.cost).toBe(-5);
    });

    it('chantier construit maintenant : aucun effet malgré les PA investis', (): void => {
        const baseline = snapshotBudget(fakeEvaluation(content([WALL])), 'x');

        const diff = budgetDiff(baseline, fakeEvaluation(content([WALL]), { progress: progress_with_wall(40, true) }));

        expect(diff.steps).toEqual([]);
        expect(diff.pools.regular.cost).toBe(0);
    });

    describe('réparations', (): void => {
        const REPAIR: PlanStepDTO = { buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 };

        /**
         * Avancement de test où la porte a les PV donnés.
         * @param {number} life PV de la porte.
         * @returns {Map<number, BuildingProgress>} Avancement des chantiers de test.
         */
        function progress_with_gate(life: number): Map<number, BuildingProgress> {
            return new Map<number, BuildingProgress>([
                [1, { buildingId: 1, paCurrent: 40, invested: 10, built: false, life: 0, maxLife: 30, def: 0, defMax: 30 }],
                [2, { buildingId: 2, paCurrent: 20, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0 }],
                [3, { buildingId: 3, paCurrent: 10, invested: 10, built: true, life, maxLife: 30, def: 5, defMax: 15 }]
            ]);
        }

        it('fige les PV du chantier réparé, pas ceux d\'une construction', (): void => {
            const snapshot = snapshotBudget(fakeEvaluation(content([WALL, REPAIR])), 'x');

            expect(snapshot.steps.find((step) => step.kind === 'repair')?.life).toBe(10);
            expect(snapshot.steps.find((step) => step.kind === 'build')?.life).toBeUndefined();
        });

        it('réparation faite depuis la validation : diff vide', (): void => {
            const baseline = snapshotBudget(fakeEvaluation(content([REPAIR])), 'x');

            const diff = budgetDiff(baseline, fakeEvaluation(content([REPAIR]), { progress: progress_with_gate(30) }));

            expect(diff.steps).toEqual([]);
            expect(diff.pools.regular).toEqual({ budget: 0, cost: 0, remaining: 0 });
        });

        it('réparation partielle : crédit limité à ce qui a été dépensé', (): void => {
            const baseline = snapshotBudget(fakeEvaluation(content([REPAIR])), 'x');
            const full: number = baseline.steps[0].paCost;

            const diff = budgetDiff(baseline, fakeEvaluation(content([REPAIR]), { progress: progress_with_gate(20) }));

            expect(full).toBeGreaterThan(0);
            expect(diff.steps).toEqual([]);
            expect(diff.pools.regular.cost).toBe(0);
        });

        it('réparation modifiée après progression : seul le vrai changement apparaît', (): void => {
            const baseline = snapshotBudget(fakeEvaluation(content([REPAIR])), 'x');
            const leave: PlanStepDTO = { ...REPAIR, mode: 'leave', targetRemaining: 5 };

            const diff = budgetDiff(baseline, fakeEvaluation(content([leave]), { progress: progress_with_gate(20) }));

            expect(diff.steps).toEqual([{ buildingId: 3, kind: 'repair', change: 'changed', delta: -2 }]);
        });
    });
});
