import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { Home } from '../../../_abstract_model/types/home.class';
import { PlanTaskDTO } from './plan.types';
import { programDone, taskCheckKey, taskLocked, TaskStatus, taskStatus } from './task-status.util';

const DAY: number = 5;

/**
 * Citoyen avec des actions du jour et une maison.
 * @param {string[]} actions Clés d'actions enregistrées au jour DAY.
 * @param {Record<string, number | boolean>} home Valeurs de maison par clé `HomeEnum`.
 * @returns {Citizen} Citoyen.
 */
function citizen(actions: string[], home: Record<string, number | boolean> = {}): Citizen {
    const result: Citizen = Object.assign(new Citizen(), { id: 1, name: 'Alice' });
    result.daily_actions = actions.map((key: string): DailyAction => Object.assign(new DailyAction(), { day: DAY, action_key: key }));
    result.home = Object.assign(new Home(), {
        content: Object.entries(home).map(([key, value]: [string, number | boolean]): { element: HomeEnum; value: number | boolean } => ({ element: HomeEnum.getByKey<HomeEnum>(key) as HomeEnum, value }))
    });
    return result;
}

describe('taskStatus', (): void => {
    it('action de chantier : faite si l\'action quotidienne est enregistrée ce jour-là', (): void => {
        const task: PlanTaskDTO = { id: 'a', kind: 'action', ref: 'home_crows', pa: 1 };

        expect(taskStatus(task, citizen(['home_crows']), DAY)).toEqual<TaskStatus>({ done: true, source: 'data' });
        expect(taskStatus(task, citizen(['home_crows']), DAY + 1)).toEqual<TaskStatus>({ done: false, source: null });
    });

    it('amélioration structurée : faite si le niveau atteint le niveau visé', (): void => {
        const task: PlanTaskDTO = { id: 'u', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 3 };

        expect(taskStatus(task, citizen([], { kitchenLevel: 3 }), DAY).done).toBe(true);
        expect(taskStatus(task, citizen([], { kitchenLevel: 1 }), DAY).done).toBe(false);
        expect(taskStatus({ id: 'l', kind: 'homeUpgrade', ref: 'hasLock', level: 1, pa: 6 }, citizen([], { hasLock: true }), DAY).done).toBe(true);
    });

    it('niveau de maison : relevé, sinon coche', (): void => {
        const task: PlanTaskDTO = { id: 'h', kind: 'home', level: 3, pa: 4 };

        expect(taskStatus(task, citizen([], { houseLevel: 3 }), DAY)).toEqual<TaskStatus>({ done: true, source: 'data' });
        expect(taskStatus(task, citizen(['task_h'], { houseLevel: 1 }), DAY)).toEqual<TaskStatus>({ done: true, source: 'check' });
        expect(taskStatus(task, citizen([], { houseLevel: 1 }), DAY).done).toBe(false);
    });

    it('consigne libre et amélioration au format libre : coche du jour', (): void => {
        expect(taskStatus({ id: 'f', kind: 'free', label: 'x', pa: 0 }, citizen(['task_f']), DAY)).toEqual<TaskStatus>({ done: true, source: 'check' });
        expect(taskStatus({ id: 'f', kind: 'free', label: 'x', pa: 0 }, citizen(['task_f']), DAY + 1).done).toBe(false);
        expect(taskStatus({ id: 'g', kind: 'homeUpgrade', label: 'Rideau', pa: 4 }, citizen(['task_g']), DAY).done).toBe(true);
    });
});

describe('taskCheckKey', (): void => {
    it('clé de la coche propre à la consigne, nulle sans identifiant', (): void => {
        expect(taskCheckKey({ id: 'abc', kind: 'free', pa: 0 })).toBe('task_abc');
        expect(taskCheckKey({ kind: 'free', pa: 0 })).toBeNull();
    });
});

describe('programDone', (): void => {
    it('terminé si au moins une consigne et toutes faites', (): void => {
        expect(programDone([{ done: true, source: 'data' }, { done: true, source: 'check' }])).toBe(true);
        expect(programDone([{ done: true, source: 'data' }, { done: false, source: null }])).toBe(false);
        expect(programDone([])).toBe(false);
    });
});

describe('taskLocked', (): void => {
    it('niveau de maison relevé : verrouillé, sauf dans une ville où il se saisit à la main', (): void => {
        const task: PlanTaskDTO = { id: 'h', kind: 'home', level: 3, pa: 4 };

        expect(taskLocked(task, { done: true, source: 'data' }, false)).toBe(true);
        expect(taskLocked(task, { done: true, source: 'data' }, true)).toBe(false);
        expect(taskLocked({ id: 'f', kind: 'free', pa: 0 }, { done: true, source: 'check' }, false)).toBe(false);
    });
});
