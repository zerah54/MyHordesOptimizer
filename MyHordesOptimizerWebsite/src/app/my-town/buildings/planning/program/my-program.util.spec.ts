import { StepResult } from '../building-progress.util';
import { BuildingPlanContentDTO, emptyPlanContent, PlanStepDTO } from '../plan.types';
import { DayEvaluation } from '../plan-evaluation.util';
import { FAKE_CITIZENS, fakeEvaluation } from '../planning.store.fake';
import { MyProgram, myProgram, MyProgramItem } from './my-program.util';

const BUILD_WALL: PlanStepDTO = { buildingId: 1, kind: 'build', targetRemaining: 0 };
const REPAIR_GATE: PlanStepDTO = { buildingId: 3, kind: 'repair', targetRemaining: 0 };

function content(overrides: Partial<BuildingPlanContentDTO> = {}): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), ...overrides };
}

function program_of(user_id: number | null, plan: BuildingPlanContentDTO, evaluation: DayEvaluation = fakeEvaluation(plan)): MyProgram | null {
    return myProgram(user_id, plan, evaluation, FAKE_CITIZENS);
}

describe('myProgram', (): void => {
    it('utilisateur absent ou inconnu : null', (): void => {
        expect(program_of(null, content())).toBeNull();
        expect(program_of(99, content())).toBeNull();
    });

    it('non-banni : uniquement les étapes de la poche non-bannis', (): void => {
        const plan: BuildingPlanContentDTO = content({ programs: { regular: [BUILD_WALL], banned: [REPAIR_GATE] } });

        const result: MyProgram = program_of(1, plan) as MyProgram;

        expect(result.steps.map((step: StepResult): number => step.step.buildingId)).toEqual([1]);
        expect(result.notices).toEqual([]);
        expect(result.capacity.userId).toBe(1);
    });

    it('tâches du citoyen, vides sans entrée', (): void => {
        const plan: BuildingPlanContentDTO = content({ citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'Puits', pa: 3 }] }] });

        expect((program_of(1, plan) as MyProgram).tasks).toEqual([{ kind: 'free', label: 'Puits', pa: 3 }]);
        expect((program_of(2, plan) as MyProgram).tasks).toEqual([]);
    });

    it('banni avec BDE : poche des bannis et avertissement des paires', (): void => {
        const plan: BuildingPlanContentDTO = content({ programs: { regular: [BUILD_WALL], banned: [REPAIR_GATE] } });

        const result: MyProgram = program_of(2, plan, fakeEvaluation(plan, { hasSlavery: true })) as MyProgram;

        expect(result.notices).toContain('pairs');
        expect(result.steps.map((step: StepResult): number => step.step.buildingId)).toEqual([3]);
    });

    it('banni sans BDE : construction interdite, seules les réparations restent', (): void => {
        const plan: BuildingPlanContentDTO = content({ programs: { regular: [], banned: [BUILD_WALL, REPAIR_GATE] } });

        const result: MyProgram = program_of(2, plan) as MyProgram;

        expect(result.notices).toContain('banned-forbidden');
        expect(result.steps.map((step: StepResult): string => step.step.kind)).toEqual(['repair']);
    });

    it('éléments de la poche dans l\'ordre, consignes intercalées', (): void => {
        const plan: BuildingPlanContentDTO = content({
            programs: { regular: [BUILD_WALL, { kind: 'instruction', text: 'Attendre l\'expé' }, REPAIR_GATE], banned: [{ kind: 'instruction', text: 'Bannis : réparer' }] }
        });

        const items: MyProgramItem[] = (program_of(1, plan) as MyProgram).items;

        expect(items.map((item: MyProgramItem): string => (item.kind === 'step' ? `#${item.result.step.buildingId}` : item.text))).toEqual(['#1', 'Attendre l\'expé', '#3']);
    });

    it('banni sans BDE : les consignes de sa poche restent avec les réparations', (): void => {
        const plan: BuildingPlanContentDTO = content({ programs: { regular: [], banned: [BUILD_WALL, { kind: 'instruction', text: 'x' }, REPAIR_GATE] } });

        const items: MyProgramItem[] = (program_of(2, plan) as MyProgram).items;

        expect(items.map((item: MyProgramItem): string => item.kind)).toEqual(['instruction', 'step']);
    });

    it('rappelle le chantier à voter ce soir', (): void => {
        expect((program_of(1, content({ eveningVoteBuildingId: 2 })) as MyProgram).voteBuildingId).toBe(2);
        expect((program_of(1, content()) as MyProgram).voteBuildingId).toBeNull();
    });

    it('rappelle le second chantier voté seulement avec le Brasier Sacrificiel', (): void => {
        const plan: BuildingPlanContentDTO = content({ eveningVoteBuildingId: 2, eveningSecondVoteBuildingId: 3 });
        const double: DayEvaluation = { ...fakeEvaluation(plan), doubleVote: true, secondVote: { uid: 'gate', level: 1, defense: 0 } };

        expect((program_of(1, plan, double) as MyProgram).secondVoteBuildingId).toBe(3);
        expect((program_of(1, plan) as MyProgram).secondVoteBuildingId).toBeNull();
    });

    it('consignes du jour rognées, nulles si vides', (): void => {
        expect((program_of(1, content({ instructions: '  Planches en banque  ' })) as MyProgram).dayInstructions).toBe('Planches en banque');
        expect((program_of(1, content({ instructions: '   ' })) as MyProgram).dayInstructions).toBeNull();
    });

    it('tâches au-delà des PA de base : avertissement', (): void => {
        const plan: BuildingPlanContentDTO = content({ citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'Gros chantier', pa: 25 }] }] });

        expect((program_of(1, plan) as MyProgram).notices).toContain('over-committed');
    });

    it('PA d\'expédition du citoyen, 0 par défaut', (): void => {
        const plan: BuildingPlanContentDTO = content();
        const evaluation: DayEvaluation = fakeEvaluation(plan, { expeditionPa: new Map<number, number>([[1, 8]]) });

        expect((program_of(1, plan, evaluation) as MyProgram).expeditionPa).toBe(8);
        expect((program_of(2, plan, evaluation) as MyProgram).expeditionPa).toBe(0);
    });
});
