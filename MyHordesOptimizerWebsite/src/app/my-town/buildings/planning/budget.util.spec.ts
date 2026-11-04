import {
    bannedPoolForced,
    bannedPoolShown,
    BudgetCitizen,
    CitizenCapacity,
    citizenCapacity,
    expeditionPaByCitizen,
    poolBudgets,
    TECHNICIAN_CP
} from './budget.util';
import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';

function citizen(overrides: Partial<BudgetCitizen> = {}): BudgetCitizen {
    return { userId: 1, banned: false, technician: false, basePa: 19, expeditionPa: 0, taskPa: 0, apOnlyTaskPa: 0, ...overrides };
}

describe('budget.util', (): void => {
    describe('affichage de la poche des bannis', (): void => {
        const REGULAR_ONLY: { banned: boolean }[] = [{ banned: false }];

        it('masquée sans banni, sans BDE, sans contenu et sans activation', (): void => {
            expect(bannedPoolForced(emptyPlanContent(), REGULAR_ONLY, false)).toBe(false);
            expect(bannedPoolShown(emptyPlanContent(), REGULAR_ONLY, false)).toBe(false);
        });

        it('affichée quand la gestion des bannis est activée, sans être imposée', (): void => {
            const content: BuildingPlanContentDTO = { ...emptyPlanContent(), manageBanned: true };
            expect(bannedPoolForced(content, REGULAR_ONLY, false)).toBe(false);
            expect(bannedPoolShown(content, REGULAR_ONLY, false)).toBe(true);
        });

        it('imposée par un citoyen banni', (): void => {
            expect(bannedPoolForced(emptyPlanContent(), [{ banned: false }, { banned: true }], false)).toBe(true);
            expect(bannedPoolShown(emptyPlanContent(), [{ banned: false }, { banned: true }], false)).toBe(true);
        });

        it('imposée par le BDE', (): void => {
            expect(bannedPoolForced(emptyPlanContent(), REGULAR_ONLY, true)).toBe(true);
        });

        it('imposée par une étape ou une consigne côté bannis', (): void => {
            const step: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }], regular: [] } };
            const instruction: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [{ kind: 'instruction', text: 'Attendre' }], regular: [] } };
            expect(bannedPoolForced(step, REGULAR_ONLY, false)).toBe(true);
            expect(bannedPoolForced(instruction, REGULAR_ONLY, false)).toBe(true);
        });

        it('imposée par une ligne de ville côté bannis, pas par une ligne côté non-bannis', (): void => {
            const banned_line: BuildingPlanContentDTO = { ...emptyPlanContent(), townLines: [{ label: 'x', pool: 'banned', pa: 1 }] };
            const regular_line: BuildingPlanContentDTO = { ...emptyPlanContent(), townLines: [{ label: 'x', pool: 'regular', pa: 1 }] };
            expect(bannedPoolForced(banned_line, REGULAR_ONLY, false)).toBe(true);
            expect(bannedPoolForced(regular_line, REGULAR_ONLY, false)).toBe(false);
        });

        it('un plan enregistré avant le réglage (champ absent) suit les mêmes règles', (): void => {
            const legacy: BuildingPlanContentDTO = { ...emptyPlanContent() };
            delete (legacy as Partial<BuildingPlanContentDTO>).manageBanned;
            expect(bannedPoolShown(legacy, REGULAR_ONLY, false)).toBe(false);
        });
    });

    describe('citizenCapacity', (): void => {
        it('PA de base moins expédition et tâches', (): void => {
            const capacity: CitizenCapacity = citizenCapacity(citizen({ expeditionPa: 8, taskPa: 3 }));
            expect(capacity.paCapacity).toBe(8);
            expect(capacity.capacity).toBe(8);
            expect(capacity.overCommitted).toBe(false);
        });

        it('un technicien ajoute ses PC, consommés avant les PA par les tâches', (): void => {
            expect(TECHNICIAN_CP).toBe(6);
            const capacity: CitizenCapacity = citizenCapacity(citizen({ technician: true, taskPa: 4 }));
            expect(capacity.cpCapacity).toBe(2);
            expect(capacity.paCapacity).toBe(19);
            expect(capacity.capacity).toBe(21);
        });

        it('des tâches plus grosses que les PC entament les PA', (): void => {
            const capacity: CitizenCapacity = citizenCapacity(citizen({ technician: true, taskPa: 9 }));
            expect(capacity.cpCapacity).toBe(0);
            expect(capacity.paCapacity).toBe(16);
        });

        it('les PC d\'un technicien ne paient pas les tâches payables en PA seulement (agrandissement)', (): void => {
            const capacity: CitizenCapacity = citizenCapacity(citizen({ technician: true, taskPa: 2, apOnlyTaskPa: 5 }));
            expect(capacity.cpCapacity).toBe(4);
            expect(capacity.paCapacity).toBe(14);
            expect(capacity.capacity).toBe(18);
        });

        it('un citoyen sur-engagé a une capacité nulle, jamais négative', (): void => {
            const capacity: CitizenCapacity = citizenCapacity(citizen({ expeditionPa: 25, taskPa: 3 }));
            expect(capacity.capacity).toBe(0);
            expect(capacity.overCommitted).toBe(true);
        });
    });

    describe('poolBudgets', (): void => {
        it('additionne les capacités et les lignes de chaque poche et déduit les coûts', (): void => {
            const capacities: CitizenCapacity[] = [
                citizenCapacity(citizen({ userId: 1, banned: true })),
                citizenCapacity(citizen({ userId: 2, banned: true })),
                citizenCapacity(citizen({ userId: 3 }))
            ];

            const budgets: ReturnType<typeof poolBudgets> = poolBudgets(
                capacities,
                [{ pool: 'regular', pa: -2 }, { pool: 'regular', pa: 40 }, { pool: 'banned', pa: 0 }],
                { banned: 30, regular: 50 }
            );

            expect(budgets.banned.citizenCapacity).toBe(38);
            expect(budgets.banned.remaining).toBe(8);
            expect(budgets.regular.citizenCapacity).toBe(19);
            expect(budgets.regular.lines).toBe(38);
            expect(budgets.regular.budget).toBe(57);
            expect(budgets.regular.remaining).toBe(7);
        });

        it('un reste négatif est conservé avec son signe', (): void => {
            const budgets: ReturnType<typeof poolBudgets> = poolBudgets([citizenCapacity(citizen())], [], { banned: 0, regular: 25 });
            expect(budgets.regular.remaining).toBe(-6);
        });
    });

    describe('expeditionPaByCitizen', (): void => {
        it('compte la longueur du tracé (boucle comprise) pour chaque citoyen de la partie', (): void => {
            const result: { pa: Map<number, number>; partsWithoutRoute: number } = expeditionPaByCitizen([
                { routeLength: 6, citizenIds: [1, 2] },
                { routeLength: 4, citizenIds: [2] }
            ]);
            expect(result.pa.get(1)).toBe(6);
            expect(result.pa.get(2)).toBe(10);
            expect(result.partsWithoutRoute).toBe(0);
        });

        it('une partie sans tracé compte 0 et est signalée', (): void => {
            const result: { pa: Map<number, number>; partsWithoutRoute: number } = expeditionPaByCitizen([{ routeLength: null, citizenIds: [1] }]);
            expect(result.pa.get(1)).toBeUndefined();
            expect(result.partsWithoutRoute).toBe(1);
        });
    });
});
