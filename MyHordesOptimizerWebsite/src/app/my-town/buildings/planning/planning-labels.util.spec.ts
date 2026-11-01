import { Item } from '../../../_abstract_model/types/item.class';
import { StepResult } from './building-progress.util';
import { HomeLevelRef } from './plan-evaluation.util';
import { PlanStepDTO } from './plan.types';
import { itemLabel, ratioLabel, stepLabel, taskLabel } from './planning-labels.util';

describe('planning-labels.util', (): void => {
    const items: Item[] = [Object.assign(new Item(), { id: 5, uid: 'wood', label: { fr: 'Bois', en: 'Wood' } })];

    it('itemLabel : libellé dans la langue, sinon uid, sinon identifiant', (): void => {
        expect(itemLabel(items, 5, 'fr')).toBe('Bois');
        expect(itemLabel(items, 5, 'de')).toBe('wood');
        expect(itemLabel(items, 99, 'fr')).toBe('#99');
    });

    function result(step: PlanStepDTO, pa_cost: number = 0): StepResult {
        return { step, pool: 'regular', index: 0, points: 0, paCost: pa_cost, remainingAfter: 0, completes: false, issues: [] };
    }

    it('stepLabel : terminer ou laisser à N PA', (): void => {
        expect(stepLabel('Mur', result({ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }), 30)).toBe('Terminer Mur');
        expect(stepLabel('Mur', result({ buildingId: 1, kind: 'build', mode: 'leave', targetRemaining: 12 }), 30)).toBe('Laisser Mur à 12 :ap:');
        expect(stepLabel('Mur', result({ buildingId: 1, kind: 'build', targetRemaining: 12 }), 30)).toBe('Laisser Mur à 12 :ap:');
    });

    it('stepLabel : réparer entièrement, pour passer la nuit ou jusqu\'à N PV, avec le coût estimé', (): void => {
        expect(stepLabel('Mur', result({ buildingId: 1, kind: 'repair', mode: 'finish', targetRemaining: 0 }, 10), 30)).toBe('Réparer entièrement Mur');
        expect(stepLabel('Mur', result({ buildingId: 1, kind: 'repair', mode: 'survive', targetRemaining: 0 }, 6), 30)).toBe('Réparer Mur pour passer la nuit (≈ 6 :ap:)');
        expect(stepLabel('Mur', result({ buildingId: 1, kind: 'repair', mode: 'leave', targetRemaining: 8 }, 6), 30)).toBe('Réparer Mur jusqu\'à 22/30 PV (≈ 6 :ap:)');
    });

    it('ratioLabel : valeur arrondie, infini, absent', (): void => {
        expect(ratioLabel(2)).toBe('2.00');
        expect(ratioLabel(0.8823)).toBe('0.88');
        expect(ratioLabel(Infinity)).toBe('∞');
        expect(ratioLabel(null)).toBe('—');
    });
});

describe('taskLabel', (): void => {
    const homes: Map<number, HomeLevelRef> = new Map<number, HomeLevelRef>([[3, { level: 3, label: 'Taudis', def: 0, ap: 0, apUrbanism: 0, resources: [] }]]);

    it('action de chantier : libellé officiel de l\'action', (): void => {
        expect(taskLabel({ kind: 'action', ref: 'home_crows', pa: 1 }, homes)).toBe('Cartographier le désert');
    });

    it('action inconnue : sa clé', (): void => {
        expect(taskLabel({ kind: 'action', ref: 'home_unknown', pa: 1 }, homes)).toBe('home_unknown');
    });

    it('amélioration structurée : libellé et niveau visé, sans niveau pour une amélioration à un seul niveau', (): void => {
        expect(taskLabel({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 3 }, homes)).toBe('Cuisine niv. 2');
        expect(taskLabel({ kind: 'homeUpgrade', ref: 'hasLock', level: 1, pa: 6 }, homes)).toBe('Verrou');
    });

    it('amélioration au format libre et maison : inchangés', (): void => {
        expect(taskLabel({ kind: 'homeUpgrade', label: 'Rideau', pa: 4 }, homes)).toBe('Rideau');
        expect(taskLabel({ kind: 'home', level: 3, pa: 4 }, homes)).toBe('Taudis');
    });
});
