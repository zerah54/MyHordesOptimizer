import { beforeAll, describe, expect, it, vi } from 'vitest';

import { HOUSE_LEVEL_LABELS } from '../data/home-labels';
import type { PlanStep, PlanTask } from '../types/building-plan';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));

type MyProgramModule = typeof import('./my-program');

let stepLabel: MyProgramModule['stepLabel'];
let taskText: MyProgramModule['taskText'];

beforeAll(async (): Promise<void> => {
    document.documentElement.lang = 'fr';
    const module: MyProgramModule = await import('./my-program');
    stepLabel = module.stepLabel;
    taskText = module.taskText;
});

const step = (kind: PlanStep['kind'], mode: PlanStep['mode'], targetRemaining: number = 0): PlanStep => ({ buildingId: 1, kind, mode, targetRemaining });
const task = (t: Partial<PlanTask>): PlanTask => ({ kind: 'free', pa: 0, ...t });

describe('stepLabel', () => {
    it('chantier à finir : libellé seul', () => {
        expect(stepLabel(step('build', 'finish'), 'Mur', 0)).toBe('Mur');
    });
    it('chantier à laisser', () => {
        expect(stepLabel(step('build', 'leave', 10), 'Pompe à eau', 0)).toBe('Laisser Pompe à eau à 10PA');
    });
    it('réparer pour survivre', () => {
        expect(stepLabel(step('repair', 'survive'), 'Atelier', 20)).toBe('Réparer Atelier pour passer la nuit');
    });
    it('réparer jusqu\'à N PV', () => {
        expect(stepLabel(step('repair', 'leave', 3), 'Atelier', 20)).toBe('Réparer Atelier jusqu\'à 17/20 PV');
    });
    it('réparer entièrement', () => {
        expect(stepLabel(step('repair', 'finish'), 'Atelier', 20)).toBe('Réparer entièrement Atelier');
    });
});

describe('taskText', () => {
    it('action', () => {
        expect(taskText(task({ kind: 'action', ref: 'trash', pa: 1 }))).toBe('Fouiller les déchets (1PA)');
    });
    it('action répétée', () => {
        expect(taskText(task({ kind: 'action', ref: 'home_scavenge', count: 2, pa: 2 }))).toBe('Creuser dans les galeries ×2 (2PA)');
    });
    it('amélioration de maison', () => {
        expect(taskText(task({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }))).toBe('Cuisine niv. 2 (9PA)');
    });
    it('niveau de maison sans PA', () => {
        expect(taskText(task({ kind: 'home', level: 1 }))).toBe(HOUSE_LEVEL_LABELS[1].fr);
    });
    it('consigne libre vide', () => {
        expect(taskText(task({ kind: 'free', label: '' }))).toBe('—');
    });
});
