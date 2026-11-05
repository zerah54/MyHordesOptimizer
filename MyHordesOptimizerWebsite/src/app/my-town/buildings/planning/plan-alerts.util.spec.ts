import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { alertAnchor, alertCard, PlanAlert, planAlerts, stepIssueLabel } from './plan-alerts.util';
import { FAKE_BUILDINGS, FAKE_CITIZENS, fakeEvaluation } from './planning.store.fake';

function content(overrides: Partial<BuildingPlanContentDTO>): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), ...overrides };
}

describe('plan-alerts.util', (): void => {
    it('une alerte hors programme relève du budget, les autres du programme', (): void => {
        expect(alertCard({ text: '', pool: null, index: null })).toBe('budget');
        expect(alertCard({ text: '', pool: 'regular', index: null })).toBe('program');
        expect(alertCard({ text: '', pool: 'banned', index: 2 })).toBe('program');
    });

    it('une alerte repère sa ligne, sinon sa section, sinon rien', (): void => {
        expect(alertAnchor({ text: '', pool: 'banned', index: 2 })).toBe('plan-item-banned-2');
        expect(alertAnchor({ text: '', pool: 'regular', index: null })).toBe('plan-section-regular');
        expect(alertAnchor({ text: '', pool: null, index: null })).toBeNull();
    });

    it('un plan sans souci n\'a aucune alerte', (): void => {
        expect(planAlerts(fakeEvaluation(content({})), FAKE_BUILDINGS, FAKE_CITIZENS)).toEqual([]);
    });

    it('une alerte par problème d\'étape, repérée par sa poche et son rang', (): void => {
        const evaluation: ReturnType<typeof fakeEvaluation> = fakeEvaluation(content({
            programs: { banned: [{ kind: 'instruction', text: 'x' }, { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }], regular: [] }
        }));
        const alerts: PlanAlert[] = planAlerts(evaluation, FAKE_BUILDINGS, FAKE_CITIZENS);
        expect(alerts).toEqual([{ text: `Mur : ${stepIssueLabel('banned-cannot-build')}`, pool: 'banned', index: 1 }]);
    });

    it('signale un citoyen dont les tâches et l\'expédition dépassent ses PA de base', (): void => {
        const evaluation: ReturnType<typeof fakeEvaluation> = fakeEvaluation(content({
            citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'x', pa: 30 }] }]
        }));
        const alerts: PlanAlert[] = planAlerts(evaluation, FAKE_BUILDINGS, FAKE_CITIZENS);
        expect(alerts.some((alert: PlanAlert): boolean => alert.text === 'Alice : Consignes individuelles et expédition dépassent les PA de base' && alert.pool === null)).toBe(true);
    });

    it('les libellés sont du texte brut, sans balise de composant (affichés en interpolation)', (): void => {
        expect(stepIssueLabel('slavery-rounding')).toBe('Investir par paires de PA : le rendement est réduit');
    });

    it('signale une poche dont le budget est dépassé', (): void => {
        const evaluation: ReturnType<typeof fakeEvaluation> = fakeEvaluation(content({
            basePa: 0,
            programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] }
        }));
        const overrun: number = -evaluation.budgets.regular.remaining;
        const alerts: PlanAlert[] = planAlerts(evaluation, FAKE_BUILDINGS, FAKE_CITIZENS);
        expect(overrun).toBeGreaterThan(0);
        expect(alerts.some((alert: PlanAlert): boolean => alert.pool === 'regular' && alert.index === null && alert.text.includes(`${overrun} PA`))).toBe(true);
    });

    it('sans poche des bannis affichée, le dépassement de budget ne nomme aucune poche', (): void => {
        const evaluation: ReturnType<typeof fakeEvaluation> = fakeEvaluation(content({
            basePa: 0,
            programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] }
        }));
        const overrun: number = -evaluation.budgets.regular.remaining;
        const alert: PlanAlert | undefined = planAlerts(evaluation, FAKE_BUILDINGS, FAKE_CITIZENS, false).find((candidate: PlanAlert): boolean => candidate.pool === 'regular');
        expect(alert?.text).toContain(`${overrun} PA`);
        expect(alert?.text).not.toMatch(/bannis/i);
    });
});
