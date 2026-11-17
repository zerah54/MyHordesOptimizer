import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { PlanningDataService, PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { BuildingPlanContentDTO, BuildingPlanDTO, emptyPlanContent } from '../../buildings/planning/plan.types';
import { BuildingNeeds, NightwatchBuildingNeedsService } from './building-needs.service';

function wall(): Building {
    return new Building({
        id: 1, uid: 'wall', img: '', label: { fr: 'Mur' }, description: { fr: '' }, parentId: null, displayOrder: 0,
        pa: 40, defence: 30, maxLife: 30, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
        resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 2 }],
        hasHardMode: false, tier0Ap: null, tier1Ap: null, tier2Ap: null, tier0Resources: [], tier1Resources: [],
        hardBlueprintLevel: null, availability: {}
    });
}

function plan(day: number, effective: boolean, content: BuildingPlanContentDTO): BuildingPlanDTO {
    return { id: day, day, name: 'P', isEffective: effective, version: 1, authorId: 1, authorName: null, content, lastUpdateInfo: null };
}

function data(plans: BuildingPlanDTO[]): PlanningStatic {
    return {
        plans: { access: { isCitizen: true, canEdit: true }, plans, itemValues: { '5': 2 }, settingsVersion: 1 },
        state: {
            buildings: [{ buildingId: 1, isBuilt: false, paCurrent: 40, apRemaining: 4, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] }],
            defense: null
        },
        buildings: [wall()],
        items: [Object.assign(new Item(), { id: 5, uid: 'wood' })],
        homes: { levels: [], upgrades: [] },
        citizens: [1, 2, 3].map((id: number): Citizen => Object.assign(new Citizen(), { id, name: `C${id}`, is_dead: false })),
        bank: [],
        upgrades: {},
        item_emotes: {}
    };
}

describe('NightwatchBuildingNeedsService', (): void => {
    const build_wall: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }] } };
    let load_static: Mock;
    let load_day: Mock;

    function needs(day: number, current_day: number = 10): Promise<BuildingNeeds> {
        return new Promise<BuildingNeeds>((resolve: (value: BuildingNeeds) => void): void => {
            TestBed.inject(NightwatchBuildingNeedsService).needsOfDay(day, current_day).subscribe(resolve);
        });
    }

    beforeEach((): void => {
        load_static = vi.fn((): Observable<PlanningStatic> => of(data([plan(11, true, build_wall)])));
        load_day = vi.fn((): Observable<PlanningDay> => of({ expeditions: [], attack: null }));
        TestBed.configureTestingModule({ providers: [{ provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } }] });
    });

    it('somme les objets des chantiers terminés par le plan effectif du jour', async (): Promise<void> => {
        const result: BuildingNeeds = await needs(11);
        expect(result.status).toBe('ready');
        expect(result.needs).toEqual([{ itemId: 5, count: 2 }]);
        expect(load_day).toHaveBeenCalledTimes(2);
    });

    it('indisponible sans plan effectif ce jour-là', async (): Promise<void> => {
        load_static.mockReturnValue(of(data([plan(11, false, build_wall)])));
        expect((await needs(11)).status).toBe('unavailable');
    });

    it('indisponible pour un jour passé, sans rien charger', async (): Promise<void> => {
        expect((await needs(9)).status).toBe('unavailable');
        expect(load_static).not.toHaveBeenCalled();
    });

    it('indisponible, sans erreur, si le chargement échoue', async (): Promise<void> => {
        load_static.mockReturnValue(throwError((): Error => new Error('boom')));
        expect((await needs(11)).status).toBe('unavailable');
    });

    it('un échec du chargement d\'un jour n\'empêche pas le calcul', async (): Promise<void> => {
        load_day.mockReturnValue(throwError((): Error => new Error('boom')));
        expect((await needs(11)).status).toBe('ready');
    });
});
