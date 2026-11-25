import { BuildingPlanContentDTO, BuildingPlanDTO, emptyPlanContent, PlanItemDTO } from '../buildings/planning/plan.types';
import { plannedBuildings, PlannedBuildings, RealBuildings } from './nightwatch-planned-buildings.util';

const TODAY: number = 10;
const UIDS: ReadonlyMap<number, string> = new Map<number, string>([[1, 'animal_shop'], [2, 'small_round_path_#00'], [3, 'small_pyre_#00'], [4, 'wall']]);
const REAL: RealBuildings = { built_uids: ['wall'], round_path_level: 0 };

function plan(day: number, content: Partial<BuildingPlanContentDTO> = {}, overrides: Partial<BuildingPlanDTO> = {}): BuildingPlanDTO {
    return { id: day, day, name: 'P', isEffective: true, version: 1, content: { ...emptyPlanContent(), ...content }, lastUpdateInfo: null, ...overrides } as BuildingPlanDTO;
}

function building(...ids: number[]): Partial<BuildingPlanContentDTO> {
    const steps: PlanItemDTO[] = ids.map((id: number): PlanItemDTO => ({ buildingId: id, kind: 'build', mode: 'leave', targetRemaining: 10 }));
    return { programs: { banned: [], regular: [...steps, { kind: 'instruction', text: 'x' }, { buildingId: 4, kind: 'repair', targetRemaining: 0 }] } };
}

function run(plans: BuildingPlanDTO[], target_day: number = TODAY, plan_id: number | null = null): PlannedBuildings | null {
    return plannedBuildings(plans, UIDS, REAL, TODAY, target_day, plan_id);
}

describe('plannedBuildings', (): void => {
    it('tout chantier d\'un programme jusqu\'au jour visé est construit, même inachevé ; rien au-delà', (): void => {
        expect(run([plan(TODAY, building(1))])?.built_uids).toEqual(new Set(['wall', 'animal_shop']));
        expect(run([plan(TODAY, building(1))], TODAY + 2)?.built_uids.has('animal_shop')).toBe(true);
        expect(run([plan(TODAY + 1, building(1))])?.built_uids.has('animal_shop')).toBe(false);
    });

    it('jours précédents : effective seulement ; jour visé : choisie, sinon effective, sinon première', (): void => {
        const other: BuildingPlanDTO = plan(TODAY, building(1), { id: 51, isEffective: false });
        expect(run([other], TODAY + 1)?.built_uids.has('animal_shop')).toBe(false);
        expect(run([other])?.plan_id).toBe(51);
        expect(run([plan(TODAY, {}, { id: 50 }), other], TODAY, 51)?.built_uids.has('animal_shop')).toBe(true);
        expect(run([plan(TODAY, {}, { id: 50 }), other], TODAY, 999)?.plan_id).toBe(50);
    });

    it('chemin de ronde : +1 par vote du soir appliqué avant l\'attaque, s\'il est construit, plafonné à 3', (): void => {
        expect(run([plan(TODAY, { ...building(2), eveningVoteBuildingId: 2 })])?.round_path_level).toBe(1);
        expect(run([plan(TODAY, { eveningVoteBuildingId: 2 })])?.round_path_level).toBe(0);
        const days: BuildingPlanDTO[] = [TODAY, TODAY + 1, TODAY + 2, TODAY + 3].map((day: number): BuildingPlanDTO => plan(day, { ...building(2), eveningVoteBuildingId: 2 }));
        expect(run(days, TODAY + 3)?.round_path_level).toBe(3);
    });

    it('second vote compté seulement avec le Brasier Sacrificiel', (): void => {
        expect(run([plan(TODAY, { ...building(2), eveningVoteBuildingId: 1, eveningSecondVoteBuildingId: 2 })])?.round_path_level).toBe(0);
        expect(run([plan(TODAY, { ...building(2, 3), eveningVoteBuildingId: 1, eveningSecondVoteBuildingId: 2 })])?.round_path_level).toBe(1);
    });

    it('jour passé : inconnu', (): void => {
        expect(run([plan(TODAY)], TODAY - 1)).toBeNull();
    });
});
