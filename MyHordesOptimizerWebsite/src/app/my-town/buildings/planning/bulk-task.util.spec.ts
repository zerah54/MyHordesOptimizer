import { bulkAddTask } from './bulk-task.util';
import { BuildingPlanContentDTO, emptyPlanContent, PlanCitizenDTO, PlanTaskDTO } from './plan.types';

/**
 * Citoyen 1 a déjà la consigne Repaire, citoyen 2 rien d'enregistré.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), citizens: [{ userId: 1, tasks: [{ id: 'x', kind: 'action', ref: 'home_crows', pa: 1 }] }] };
}

/**
 * Consignes d'un citoyen.
 * @param {BuildingPlanContentDTO} value Contenu.
 * @param {number} user_id Citoyen.
 * @returns {PlanTaskDTO[]} Consignes.
 */
function tasksOf(value: BuildingPlanContentDTO, user_id: number): PlanTaskDTO[] {
    return value.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks ?? [];
}

describe('bulkAddTask', (): void => {
    it('ajoute la consigne à chaque citoyen, avec un identifiant neuf et ses PA', (): void => {
        const value: BuildingPlanContentDTO = content();

        const added: number = bulkAddTask(value, [1, 2], { kind: 'action', ref: 'home_scavenge' }, (user_id: number): number => (user_id === 1 ? 3 : 2));

        expect(added).toBe(2);
        expect(tasksOf(value, 1)[1]).toEqual({ id: expect.stringMatching(/^[a-z0-9]{10}$/), kind: 'action', ref: 'home_scavenge', pa: 3 });
        expect(tasksOf(value, 2)).toEqual([{ id: expect.stringMatching(/^[a-z0-9]{10}$/), kind: 'action', ref: 'home_scavenge', pa: 2 }]);
        expect(tasksOf(value, 1)[1].id).not.toBe(tasksOf(value, 2)[0].id);
    });

    it('range le nombre d\'utilisations d\'une action quand il dépasse 1', (): void => {
        const value: BuildingPlanContentDTO = content();

        bulkAddTask(value, [1, 2], { kind: 'action', ref: 'home_scavenge' }, (user_id: number): number => (user_id === 1 ? 3 : 2), (user_id: number): number => (user_id === 1 ? 3 : 1));

        expect(tasksOf(value, 1)[1].count).toBe(3);
        expect(tasksOf(value, 2)[0].count).toBeUndefined();
    });

    it('n\'ajoute pas une consigne identique déjà présente', (): void => {
        const value: BuildingPlanContentDTO = content();

        const added: number = bulkAddTask(value, [1, 2], { kind: 'action', ref: 'home_crows' }, (): number => 1);

        expect(added).toBe(1);
        expect(tasksOf(value, 1).length).toBe(1);
    });

    it('niveau propre à chaque citoyen : un citoyen sans niveau ne reçoit rien, le doublon se juge sur son niveau', (): void => {
        const value: BuildingPlanContentDTO = { ...emptyPlanContent(), citizens: [{ userId: 3, tasks: [{ id: 'h', kind: 'home', level: 3, pa: 6 }] }] };
        const levels: Map<number, number | null> = new Map<number, number | null>([[1, null], [2, 2], [3, 3]]);

        const added: number = bulkAddTask(value, [1, 2, 3], { kind: 'home' }, (): number => 4, undefined, (user_id: number): number | null => levels.get(user_id) ?? null);

        expect(added).toBe(1);
        expect(tasksOf(value, 1)).toEqual([]);
        expect(tasksOf(value, 2)).toEqual([{ id: expect.any(String), kind: 'home', level: 2, pa: 4 }]);
        expect(tasksOf(value, 3).length).toBe(1);
    });

    it('consigne libre : le libellé rogné compte pour reconnaître un doublon', (): void => {
        const value: BuildingPlanContentDTO = content();
        bulkAddTask(value, [2], { kind: 'free', label: ' Puits ' }, (): number => 0);

        expect(bulkAddTask(value, [2], { kind: 'free', label: 'Puits' }, (): number => 0)).toBe(0);
        expect(tasksOf(value, 2)).toEqual([{ id: expect.any(String), kind: 'free', label: 'Puits', pa: 0 }]);
    });
});
