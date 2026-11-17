import { BuildingPlanContentDTO, emptyPlanContent, PlanItemDTO } from './plan.types';
import { contentForCopy } from './plan-copy.util';

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
