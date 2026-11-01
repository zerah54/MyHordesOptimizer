import { emptyPlanContent, isBuildingStep, PlanItemDTO, PlanStepDTO, stepMode } from './plan.types';

describe('plan.types', (): void => {
    it('isBuildingStep distingue les étapes de chantier des consignes', (): void => {
        const build: PlanItemDTO = { buildingId: 1, kind: 'build', targetRemaining: 0 };
        const repair: PlanItemDTO = { buildingId: 1, kind: 'repair', targetRemaining: 0 };
        const instruction: PlanItemDTO = { kind: 'instruction', text: 'Attendre l\'expé' };
        expect(isBuildingStep(build)).toBe(true);
        expect(isBuildingStep(repair)).toBe(true);
        expect(isBuildingStep(instruction)).toBe(false);
    });

    it('stepMode renvoie le mode enregistré', (): void => {
        const step: PlanStepDTO = { buildingId: 1, kind: 'repair', mode: 'survive', targetRemaining: 0 };
        expect(stepMode(step)).toBe('survive');
    });

    it('stepMode déduit le mode d\'une étape antérieure aux modes', (): void => {
        expect(stepMode({ buildingId: 1, kind: 'build', targetRemaining: 0 })).toBe('finish');
        expect(stepMode({ buildingId: 1, kind: 'build', targetRemaining: 12 })).toBe('leave');
        expect(stepMode({ buildingId: 1, kind: 'build', mode: null, targetRemaining: 12 })).toBe('leave');
    });

    it('un contenu vide n\'a ni consignes du jour ni niveau de plan', (): void => {
        expect(emptyPlanContent().instructions).toBeNull();
        expect(emptyPlanContent().planTiers).toEqual({});
    });
});
