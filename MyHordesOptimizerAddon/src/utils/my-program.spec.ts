import { describe, expect, it } from 'vitest';

import type { ApiCitizen } from '../types';
import type { ApiBuildingPlan, PlanContent, PlanStep, PlanTask, TownBuildingState } from '../types/building-plan';
import { effectivePlan, programItems, SLAVERY_UID, stepDone, stepMode, taskCheckKey, taskLocked, taskStatus, taskUpgrade, withTaskIds } from './my-program';

const plan = (day: number, isEffective: boolean, id: number = 0): ApiBuildingPlan =>
    ({ id, day, isEffective, content: {} as PlanContent });
const build = (mode: PlanStep['mode'], targetRemaining: number = 0): PlanStep => ({ buildingId: 1, kind: 'build', mode, targetRemaining });
const repair = (mode: PlanStep['mode'], targetRemaining: number = 0): PlanStep => ({ buildingId: 1, kind: 'repair', mode, targetRemaining });
const state = (s: Partial<TownBuildingState>): TownBuildingState => ({ buildingId: 1, isBuilt: false, apRemaining: null, life: null, maxLife: null, ...s });
const citizen = (c: Partial<ApiCitizen>): ApiCitizen => c as ApiCitizen;

describe('effectivePlan', () => {
    it('retourne le plan effectif du jour', () => {
        expect(effectivePlan([plan(9, true), plan(10, false), plan(10, true, 3)], 10)?.id).toBe(3);
    });
    it('retourne null sans plan', () => {
        expect(effectivePlan([plan(9, true), plan(10, false)], 10)).toBeNull();
    });
});

describe('programItems', () => {
    const content: PlanContent = {
        eveningVoteBuildingId: null,
        citizens: [],
        instructions: null,
        programs: {
            regular: [build('finish'), { kind: 'instruction', text: ' Tour ' }, { kind: 'instruction', text: '   ' }],
            banned: [build('finish'), repair('finish'), { kind: 'instruction', text: 'Ok' }]
        }
    };
    it('non banni : regular, consignes rognées et vides écartées', () => {
        expect(programItems(content, false, false)).toEqual([
            { kind: 'step', step: build('finish') },
            { kind: 'instruction', text: 'Tour' }
        ]);
    });
    it('banni avec bureau : banned complet', () => {
        expect(programItems(content, true, true).length).toBe(3);
    });
    it('banni sans bureau : réparations et consignes seulement', () => {
        expect(programItems(content, true, false)).toEqual([
            { kind: 'step', step: repair('finish') },
            { kind: 'instruction', text: 'Ok' }
        ]);
    });
    it('expose SLAVERY_UID', () => {
        expect(SLAVERY_UID).toBe('small_slave_#00');
    });
});

describe('stepMode', () => {
    it('mode explicite sinon finish à 0 et leave au-delà (règle du site)', () => {
        expect(stepMode(build('survive'))).toBe('survive');
        expect(stepMode(build(undefined, 0))).toBe('finish');
        expect(stepMode(build(null, 5))).toBe('leave');
    });
});

describe('stepDone', () => {
    it('null sans état', () => expect(stepDone(build('finish'), undefined)).toBeNull());
    it('build finish', () => {
        expect(stepDone(build('finish'), state({ isBuilt: true }))).toBe(true);
        expect(stepDone(build('finish'), state({ apRemaining: 0 }))).toBe(false);
    });
    it('build leave', () => {
        expect(stepDone(build('leave', 10), state({ apRemaining: 10 }))).toBe(true);
        expect(stepDone(build('leave', 10), state({ apRemaining: 11 }))).toBe(false);
        expect(stepDone(build('leave', 10), state({ apRemaining: null }))).toBe(false);
        expect(stepDone(build('leave', 10), state({ isBuilt: true }))).toBe(true);
    });
    it('repair finish', () => {
        expect(stepDone(repair('finish'), state({ life: 10, maxLife: 10 }))).toBe(true);
        expect(stepDone(repair('finish'), state({ life: 9, maxLife: 10 }))).toBe(false);
        expect(stepDone(repair('finish'), state({ life: null, maxLife: 10 }))).toBe(false);
    });
    it('repair leave', () => {
        expect(stepDone(repair('leave', 4), state({ life: 6, maxLife: 10 }))).toBe(true);
        expect(stepDone(repair('leave', 4), state({ life: 5, maxLife: 10 }))).toBe(false);
    });
    it('repair survive : null', () => {
        expect(stepDone(repair('survive'), state({ life: 10, maxLife: 10 }))).toBeNull();
    });
});

describe('taskStatus', () => {
    const task = (t: Partial<PlanTask>): PlanTask => ({ kind: 'free', pa: 0, ...t });
    it('action : action quotidienne du jour', () => {
        const c: ApiCitizen = citizen({ dailyActions: [{ day: 10, actionKey: 'trash' }] });
        expect(taskStatus(task({ kind: 'action', ref: 'trash' }), c, 10)).toEqual({ done: true, source: 'data' });
        expect(taskStatus(task({ kind: 'action', ref: 'trash' }), c, 11)).toEqual({ done: false, source: null });
    });
    it('amélioration : niveau atteint', () => {
        const t: PlanTask = task({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2 });
        expect(taskStatus(t, citizen({ home: { content: { kitchenLevel: 2 } } }), 10)).toEqual({ done: true, source: 'data' });
        expect(taskStatus(t, citizen({ home: { content: { kitchenLevel: 1 } } }), 10).done).toBe(false);
    });
    it('amélioration booléenne', () => {
        const t: PlanTask = task({ kind: 'homeUpgrade', ref: 'hasLock', level: 1 });
        expect(taskStatus(t, citizen({ home: { content: { hasLock: true } } }), 10).done).toBe(true);
        expect(taskStatus(t, citizen({ home: { content: { hasLock: false } } }), 10).done).toBe(false);
    });
    it('maison : niveau houseLevel', () => {
        const t: PlanTask = task({ kind: 'home', level: 3 });
        expect(taskStatus(t, citizen({ home: { content: { houseLevel: 3 } } }), 10)).toEqual({ done: true, source: 'data' });
        expect(taskStatus(t, citizen({ home: { content: { houseLevel: 2 } } }), 10).done).toBe(false);
    });
    it('consigne libre : coche task_<id>', () => {
        const c: ApiCitizen = citizen({ dailyActions: [{ day: 10, actionKey: 'task_ab' }] });
        expect(taskStatus(task({ id: 'ab' }), c, 10)).toEqual({ done: true, source: 'check' });
        expect(taskStatus(task({}), c, 10)).toEqual({ done: false, source: null });
        expect(taskCheckKey(task({}))).toBeNull();
        expect(taskCheckKey(task({ id: 'ab' }))).toBe('task_ab');
    });
});

describe('taskUpgrade', () => {
    it('clé d\'une amélioration du référentiel, hors niveau d\'habitation', () => {
        expect(taskUpgrade({ kind: 'homeUpgrade', ref: 'kitchenLevel', pa: 0 })).toBe('kitchenLevel');
        expect(taskUpgrade({ kind: 'homeUpgrade', ref: 'houseLevel', pa: 0 })).toBeUndefined();
        expect(taskUpgrade({ kind: 'action', ref: 'kitchenLevel', pa: 0 })).toBeUndefined();
        expect(taskUpgrade({ kind: 'homeUpgrade', ref: null, pa: 0 })).toBeUndefined();
    });
    it('clé héritée d\'Object : undefined', () => {
        expect(taskUpgrade({ kind: 'homeUpgrade', ref: 'toString', pa: 0 })).toBeUndefined();
    });
});

describe('taskLocked', () => {
    const home: PlanTask = { kind: 'home', level: 1, pa: 0 };
    it('maison relevée verrouillée sauf saisie manuelle', () => {
        expect(taskLocked(home, { done: true, source: 'data' }, false)).toBe(true);
        expect(taskLocked(home, { done: true, source: 'data' }, true)).toBe(false);
    });
    it('amélioration jamais verrouillée', () => {
        expect(taskLocked({ kind: 'homeUpgrade', ref: 'hasLock', pa: 0 }, { done: true, source: 'data' }, false)).toBe(false);
    });
});

describe('withTaskIds', () => {
    const contentWith = (citizens: PlanContent['citizens']): PlanContent =>
        ({ eveningVoteBuildingId: null, citizens, instructions: null, programs: { banned: [], regular: [] } });

    it('toutes les consignes ont un id : même objet renvoyé', () => {
        const content: PlanContent = contentWith([{ userId: 3, tasks: [{ id: 'a', kind: 'free', pa: 0 }] }]);
        expect(withTaskIds(content, 12)).toBe(content);
    });
    it('id manquant : p<plan>u<citoyen>t<rang>, ids existants gardés', () => {
        const content: PlanContent = contentWith([
            { userId: 3, tasks: [{ id: 'a', kind: 'free', pa: 0 }, { kind: 'free', pa: 0 }, { id: '', kind: 'free', pa: 0 }] },
            { userId: 4, tasks: [{ id: null, kind: 'free', pa: 0 }] }
        ]);
        const ids: (string | null | undefined)[][] = withTaskIds(content, 12).citizens
            .map((c: { tasks: PlanTask[] }): (string | null | undefined)[] => c.tasks.map((t: PlanTask): string | null | undefined => t.id));
        expect(ids).toEqual([['a', 'p12u3t1', 'p12u3t2'], ['p12u4t0']]);
    });
    it('ne modifie pas le contenu reçu', () => {
        const content: PlanContent = contentWith([{ userId: 3, tasks: [{ id: 'a', kind: 'free', pa: 0 }, { kind: 'free', pa: 0 }] }]);
        const before: string = JSON.stringify(content);
        withTaskIds(content, 12);
        expect(JSON.stringify(content)).toBe(before);
    });
});
