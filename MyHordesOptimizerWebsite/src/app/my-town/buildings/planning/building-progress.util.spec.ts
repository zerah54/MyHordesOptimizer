import {
    BuildingProgress,
    evaluateProgram,
    evaluateStep,
    initialProgress,
    remainingAp,
    repairLifeAfterPa,
    repairPaFor,
    StepContext,
    StepResult
} from './building-progress.util';
import { PlanProgramsDTO, PlanStepDTO } from './plan.types';

const CONTEXT: StepContext = { workshopLevel: 0, hasSlavery: false };

function progress(overrides: Partial<BuildingProgress> = {}): BuildingProgress {
    return { buildingId: 1, paCurrent: 40, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0, ...overrides };
}

function build(target: number, buildingId: number = 1): PlanStepDTO {
    return { buildingId, kind: 'build', targetRemaining: target };
}

describe('building-progress.util', (): void => {
    describe('initialProgress / remainingAp', (): void => {
        it('déduit les PA investis des PA restants bruts', (): void => {
            const state: BuildingProgress = initialProgress({ buildingId: 1, paCurrent: 40, apRemaining: 12, isBuilt: false, life: null, maxLife: null, def: null, defMax: 0 });
            expect(state.invested).toBe(28);
            expect(remainingAp(state, 0)).toBe(12);
        });

        it('applique la réduction d\'atelier sur le coût, pas sur ce qui est déjà investi', (): void => {
            expect(remainingAp(progress({ paCurrent: 40, invested: 28 }), 4)).toBe(2);
            expect(remainingAp(progress({ paCurrent: 40, invested: 35 }), 4)).toBe(0);
        });

        it('un chantier sans état synchronisé n\'a rien d\'investi', (): void => {
            const state: BuildingProgress = initialProgress({ buildingId: 1, paCurrent: 40, apRemaining: null, isBuilt: false, life: null, maxLife: null, def: null, defMax: 0 });
            expect(state.invested).toBe(0);
        });

        it('un chantier construit n\'a plus rien à construire', (): void => {
            expect(remainingAp(progress({ built: true }), 0)).toBe(0);
        });

        it('des PA restants supérieurs au coût ne donnent pas d\'investissement négatif', (): void => {
            expect(initialProgress({ buildingId: 1, paCurrent: 10, apRemaining: 25, isBuilt: false, life: null, maxLife: null, def: null, defMax: 0 }).invested).toBe(0);
        });
    });

    describe('evaluateStep — construction', (): void => {
        it('non-banni : les points sont les PA, la cible détermine le reste', (): void => {
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(build(2), 'regular', progress({ invested: 10 }), CONTEXT);
            expect(result.points).toBe(28);
            expect(result.paCost).toBe(28);
            expect(result.remainingAfter).toBe(2);
            expect(result.completes).toBe(false);
            expect(next?.invested).toBe(38);
        });

        it('terminer (cible 0) construit le chantier', (): void => {
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(build(0), 'regular', progress({ invested: 38, maxLife: 30, defMax: 15 }), CONTEXT);
            expect(result.completes).toBe(true);
            expect(next?.built).toBe(true);
            expect(next?.life).toBe(30);
            expect(next?.def).toBe(15);
        });

        it('une cible supérieure ou égale au reste n\'investit rien et le signale', (): void => {
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(build(50), 'regular', progress({ invested: 10 }), CONTEXT);
            expect(result.points).toBe(0);
            expect(result.paCost).toBe(0);
            expect(result.remainingAfter).toBe(30);
            expect(result.issues).toContain('no-progress');
            expect(next?.invested).toBe(10);
        });

        it('tient compte de l\'atelier', (): void => {
            const { result }: { result: StepResult } = evaluateStep(build(0), 'regular', progress({ paCurrent: 40, invested: 0 }), { workshopLevel: 4, hasSlavery: false });
            expect(result.points).toBe(30);
        });

        it('banni sans BDE : refus, état inchangé', (): void => {
            const input: BuildingProgress = progress();
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(build(0), 'banned', input, CONTEXT);
            expect(result.issues).toContain('banned-cannot-build');
            expect(result.points).toBe(0);
            expect(result.paCost).toBe(0);
            expect(next).toBe(input);
        });

        it('banni avec BDE : 2 PA investis rendent 3 points', (): void => {
            const { result }: { result: StepResult } = evaluateStep(build(34), 'banned', progress({ paCurrent: 40 }), { workshopLevel: 0, hasSlavery: true });
            expect(result.points).toBe(6);
            expect(result.paCost).toBe(4);
            expect(result.issues).not.toContain('slavery-rounding');
        });

        it('banni avec BDE : un nombre de points non multiple de 3 est signalé et arrondi au PA supérieur', (): void => {
            const { result }: { result: StepResult } = evaluateStep(build(35), 'banned', progress({ paCurrent: 40 }), { workshopLevel: 0, hasSlavery: true });
            expect(result.points).toBe(5);
            expect(result.paCost).toBe(4);
            expect(result.issues).toContain('slavery-rounding');
        });

        it('chantier déjà construit ou inconnu : erreur sans effet', (): void => {
            expect(evaluateStep(build(0), 'regular', progress({ built: true }), CONTEXT).result.issues).toContain('already-built');
            const unknown: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(build(0), 'regular', undefined, CONTEXT);
            expect(unknown.result.issues).toContain('unknown-building');
            expect(unknown.next).toBeUndefined();
        });
    });

    describe('evaluateStep — réparation', (): void => {
        const repaired: BuildingProgress = progress({ built: true, life: 10, maxLife: 30, def: 5, defMax: 15 });
        const repair: PlanStepDTO = { buildingId: 1, kind: 'repair', targetRemaining: 0 };

        it('coût = ⌈PV manquants / PV par PA⌉, défense proportionnelle aux PV', (): void => {
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(repair, 'regular', repaired, CONTEXT);
            expect(result.paCost).toBe(10);
            expect(result.points).toBe(20);
            expect(result.remainingAfter).toBe(0);
            expect(next?.life).toBe(30);
            expect(next?.def).toBe(15);
        });

        it('l\'atelier augmente les PV rendus par PA', (): void => {
            const { result }: { result: StepResult } = evaluateStep(repair, 'regular', repaired, { workshopLevel: 5, hasSlavery: false });
            expect(result.paCost).toBe(5);
        });

        it('une réparation partielle laisse des PV manquants et une défense réduite', (): void => {
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep({ ...repair, targetRemaining: 10 }, 'regular', repaired, CONTEXT);
            expect(result.paCost).toBe(5);
            expect(result.remainingAfter).toBe(10);
            expect(next?.life).toBe(20);
            expect(next?.def).toBe(10);
        });

        it('les bannis réparent sans bonus ni interdiction', (): void => {
            const { result }: { result: StepResult } = evaluateStep(repair, 'banned', repaired, CONTEXT);
            expect(result.paCost).toBe(10);
            expect(result.issues).toEqual([]);
        });

        it('rien à réparer ou chantier non construit : signalé', (): void => {
            expect(evaluateStep(repair, 'regular', progress({ built: true, life: 30, maxLife: 30 }), CONTEXT).result.issues).toContain('no-progress');
            expect(evaluateStep(repair, 'regular', progress({ built: false }), CONTEXT).result.issues).toContain('not-built');
        });
    });

    describe('evaluateProgram', (): void => {
        it('évalue les bannis avant les non-bannis et enchaîne les étapes d\'un même chantier', (): void => {
            const programs: PlanProgramsDTO = { banned: [build(30)], regular: [build(0)] };
            const state: Map<number, BuildingProgress> = new Map([[1, progress({ paCurrent: 40 })]]);

            const { results, state: after }: { results: StepResult[]; state: Map<number, BuildingProgress> } = evaluateProgram(programs, state, { workshopLevel: 0, hasSlavery: true });

            expect(results.map((r: StepResult): string => r.pool)).toEqual(['banned', 'regular']);
            expect(results[0].points).toBe(10);
            expect(results[1].points).toBe(30);
            expect(after.get(1)?.built).toBe(true);
        });

        it('ne modifie pas l\'état d\'entrée', (): void => {
            const state: Map<number, BuildingProgress> = new Map([[1, progress()]]);
            evaluateProgram({ banned: [], regular: [build(0)] }, state, CONTEXT);
            expect(state.get(1)?.invested).toBe(0);
        });
    });

    describe('evaluateProgram — consignes', (): void => {
        it('evaluateProgram ignore les consignes et repère chaque résultat par son rang', (): void => {
            const programs: PlanProgramsDTO = {
                banned: [],
                regular: [{ kind: 'instruction', text: 'Attendre' }, build(2)]
            };
            const { results }: { results: StepResult[]; state: Map<number, BuildingProgress> } = evaluateProgram(
                programs,
                new Map<number, BuildingProgress>([[1, progress({ invested: 10 })]]),
                CONTEXT
            );
            expect(results.length).toBe(1);
            expect(results[0].pool).toBe('regular');
            expect(results[0].index).toBe(1);
            expect(results[0].remainingAfter).toBe(2);
        });

        it('evaluateStep numérote à 0 par défaut', (): void => {
            expect(evaluateStep(build(2), 'regular', progress(), CONTEXT).result.index).toBe(0);
        });
    });

    describe('modes', (): void => {
        function repair(mode: 'finish' | 'leave' | 'survive', target: number = 0): PlanStepDTO {
            return { buildingId: 1, kind: 'repair', mode, targetRemaining: target };
        }
        const DAMAGED: BuildingProgress = progress({ built: true, life: 10, maxLife: 30, def: 5, defMax: 15 });

        it('terminer ignore une cible restée d\'un ancien mode', (): void => {
            const step: PlanStepDTO = { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 5 };
            expect(evaluateStep(step, 'regular', progress({ invested: 10 }), CONTEXT).result.completes).toBe(true);
        });

        it('laisser à N garde la cible', (): void => {
            const step: PlanStepDTO = { buildingId: 1, kind: 'build', mode: 'leave', targetRemaining: 2 };
            expect(evaluateStep(step, 'regular', progress({ invested: 10 }), CONTEXT).result.remainingAfter).toBe(2);
        });

        it('réparer entièrement remonte aux PV max', (): void => {
            const { result }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(repair('finish', 7), 'regular', DAMAGED, CONTEXT);
            expect(result.remainingAfter).toBe(0);
            expect(result.paCost).toBe(10);
        });

        it('réparer pour passer la nuit vise perte + 1 PV', (): void => {
            const context: StepContext = { ...CONTEXT, nightLoss: new Map<number, number>([[1, 21]]) };
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(repair('survive'), 'regular', DAMAGED, context);
            expect(next?.life).toBe(22);
            expect(result.paCost).toBe(6);
            expect(result.remainingAfter).toBe(8);
        });

        it('réparer pour passer la nuit : déjà au-dessus du seuil', (): void => {
            const context: StepContext = { ...CONTEXT, nightLoss: new Map<number, number>([[1, 21]]) };
            const { result }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(repair('survive'), 'regular', progress({ built: true, life: 25, maxLife: 30 }), context);
            expect(result.paCost).toBe(0);
            expect(result.issues).toEqual(['no-progress']);
        });

        it('réparer pour passer la nuit sans perte connue : rien à faire tant qu\'il reste 1 PV', (): void => {
            expect(evaluateStep(repair('survive'), 'regular', DAMAGED, CONTEXT).result.issues).toEqual(['no-progress']);
        });
    });

    describe('chantier sans PA restant', (): void => {
        it('un chantier non construit dont le coût est déjà couvert (atelier) se termine sans PA', (): void => {
            const { result, next }: { result: StepResult; next: BuildingProgress | undefined } = evaluateStep(build(0), 'regular', progress({ paCurrent: 40, invested: 40, maxLife: 30, defMax: 15 }), CONTEXT);
            expect(result.completes).toBe(true);
            expect(result.paCost).toBe(0);
            expect(result.issues).toEqual([]);
            expect(next?.built).toBe(true);
            expect(next?.def).toBe(15);
        });
    });

    describe('conversion PV ⇄ PA', (): void => {
        it('PV après N PA, selon l\'atelier, plafonnés aux PV max', (): void => {
            expect(repairLifeAfterPa(45, 100, 13, 3)).toBe(71);
            expect(repairLifeAfterPa(45, 100, 13, 4)).toBe(84);
            expect(repairLifeAfterPa(90, 100, 13, 0)).toBe(100);
            expect(repairLifeAfterPa(45, 100, -3, 0)).toBe(45);
        });

        it('PA pour atteindre N PV, arrondis au-dessus, jamais négatifs', (): void => {
            expect(repairPaFor(45, 71, 3)).toBe(13);
            expect(repairPaFor(45, 72, 3)).toBe(14);
            expect(repairPaFor(80, 71, 0)).toBe(0);
        });
    });
});
