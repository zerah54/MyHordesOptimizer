import { BuildingPlanContentDTO, emptyPlanContent, PlanItemDTO } from './plan.types';
import { contentForCopy, mergeCopiedParts } from './plan-copy.util';

function source(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        instructions: 'Consigne',
        validatedBudget: { regular: 10 } as unknown as BuildingPlanContentDTO['validatedBudget'],
        programs: {
            banned: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }, { buildingId: 2, kind: 'build', targetRemaining: 0 }],
            regular: [
                { buildingId: 1, kind: 'build', targetRemaining: 0 },
                { buildingId: 1, kind: 'repair', mode: 'finish', targetRemaining: 0 },
                { kind: 'instruction', text: 'Texte' },
                { buildingId: 3, kind: 'build', targetRemaining: 0 }
            ] as PlanItemDTO[]
        }
    };
}

describe('contentForCopy', (): void => {
    it('retire les étapes de construction des chantiers construits, dans les deux sections', (): void => {
        const copy: BuildingPlanContentDTO = contentForCopy(source(), new Set<number>([1]));

        expect(copy.programs.banned).toEqual([{ buildingId: 2, kind: 'build', targetRemaining: 0 }]);
        expect(copy.programs.regular.map((item: PlanItemDTO): unknown => ('buildingId' in item ? `${item.buildingId}${item.kind}` : item.kind)))
            .toEqual(['1repair', 'instruction', '3build']);
    });

    it('garde les consignes, remet le budget validé à nul et ne modifie pas l\'original', (): void => {
        const original: BuildingPlanContentDTO = source();
        const copy: BuildingPlanContentDTO = contentForCopy(original, new Set<number>([1]));

        expect(copy.instructions).toBe('Consigne');
        expect(copy.validatedBudget).toBeNull();
        expect(original).toEqual(source());
        expect(copy.programs.regular).not.toBe(original.programs.regular);
    });

    it('rien de construit : tout est repris', (): void => {
        const copy: BuildingPlanContentDTO = contentForCopy(source(), new Set<number>());

        expect(copy.programs).toEqual(source().programs);
    });
});

describe('mergeCopiedParts', (): void => {
    function target(): BuildingPlanContentDTO {
        return {
            ...emptyPlanContent(),
            basePa: 10, budgetMode: 'detailed', townLines: [{ label: 'Cible', pool: 'regular', pa: 1 }], manageBanned: false,
            attackOverride: 50, instructions: 'Cible', eveningVoteBuildingId: 7,
            validatedBudget: { validatedAt: 'x', pools: { banned: { budget: 0, cost: 0 }, regular: { budget: 1, cost: 1 } }, steps: [] },
            programs: { banned: [], regular: [{ buildingId: 7, kind: 'build', targetRemaining: 0 }] },
            citizens: [
                { userId: 1, basePaOverride: 3, worker: true, tasks: [{ kind: 'free', label: 'Cible 1', pa: 1 }] },
                { userId: 2, tasks: [{ kind: 'free', label: 'Cible 2', pa: 2 }] }
            ]
        };
    }

    function copied(): BuildingPlanContentDTO {
        return {
            ...emptyPlanContent(),
            basePa: 20, budgetMode: 'simple', basePaTier: 'b7', expeditionRab: 4, townLines: [{ label: 'Source', pool: 'banned', pa: 2 }], manageBanned: true,
            attackOverride: 99, instructions: 'Source', eveningVoteBuildingId: 8, eveningSecondVoteBuildingId: 9,
            programs: { banned: [{ buildingId: 8, kind: 'build', targetRemaining: 0 }], regular: [] },
            citizens: [
                { userId: 1, worker: false, ghoul: true, tasks: [{ kind: 'free', label: 'Source 1', pa: 3 }] },
                { userId: 3, banned: true, tasks: [{ kind: 'free', label: 'Source 3', pa: 4 }] }
            ]
        };
    }

    it('budget seul : réglages de budget et saisies des citoyens copiés, programmes et consignes individuelles gardés', (): void => {
        const merged: BuildingPlanContentDTO = mergeCopiedParts(target(), copied(), { budget: true, programs: false });

        expect(merged.basePa).toBe(20);
        expect(merged.budgetMode).toBe('simple');
        expect(merged.basePaTier).toBe('b7');
        expect(merged.expeditionRab).toBe(4);
        expect(merged.townLines).toEqual([{ label: 'Source', pool: 'banned', pa: 2 }]);
        expect(merged.manageBanned).toBe(true);
        expect(merged.validatedBudget).toBeNull();
        expect(merged.programs).toEqual(target().programs);
        expect(merged.instructions).toBe('Cible');
        expect(merged.eveningVoteBuildingId).toBe(7);
        expect(merged.attackOverride).toBe(50);
        expect(merged.citizens).toEqual([
            { userId: 1, worker: false, ghoul: true, tasks: [{ kind: 'free', label: 'Cible 1', pa: 1 }] },
            { userId: 2, tasks: [{ kind: 'free', label: 'Cible 2', pa: 2 }] },
            { userId: 3, banned: true, tasks: [] }
        ]);
    });

    it('programmes seuls : programmes, consignes du jour, votes et consignes individuelles copiés, budget gardé', (): void => {
        const merged: BuildingPlanContentDTO = mergeCopiedParts(target(), copied(), { budget: false, programs: true });

        expect(merged.programs).toEqual(copied().programs);
        expect(merged.instructions).toBe('Source');
        expect(merged.eveningVoteBuildingId).toBe(8);
        expect(merged.eveningSecondVoteBuildingId).toBe(9);
        expect(merged.basePa).toBe(10);
        expect(merged.townLines).toEqual(target().townLines);
        expect(merged.validatedBudget).toEqual(target().validatedBudget);
        expect(merged.attackOverride).toBe(50);
        expect(merged.citizens).toEqual([
            { userId: 1, basePaOverride: 3, worker: true, tasks: [{ kind: 'free', label: 'Source 1', pa: 3 }] },
            { userId: 2, tasks: [] },
            { userId: 3, tasks: [{ kind: 'free', label: 'Source 3', pa: 4 }] }
        ]);
    });

    it('ne modifie ni la cible ni la copie', (): void => {
        const original_target: BuildingPlanContentDTO = target();
        const original_copied: BuildingPlanContentDTO = copied();

        mergeCopiedParts(original_target, original_copied, { budget: true, programs: true });

        expect(original_target).toEqual(target());
        expect(original_copied).toEqual(copied());
    });
});
