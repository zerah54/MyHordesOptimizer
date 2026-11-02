import { TestBed } from '@angular/core/testing';
import { Observable, of, Subscriber, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { BuildingUpgradesDTO } from '../../my-town/buildings/planning/building-upgrades.types';
import { HomeReferentialDTO } from '../../my-town/buildings/planning/home-referential.types';
import { BuildingPlansDTO, BuildingPlanStateDTO } from '../../my-town/buildings/planning/plan.types';
import { RefinementViewDTO } from '../dto/refinement.dto';
import { BankInfo } from '../types/bank-info.class';
import { Building } from '../types/building.class';
import { Citizen } from '../types/citizen.class';
import { CitizenInfo } from '../types/citizen-info.class';
import { Expedition } from '../types/expedition.class';
import { Item } from '../types/item.class';
import { ApiService } from './api.service';
import { BuildingPlanService } from './building-plan.service';
import { ExpeditionService } from './expedition.service';
import { PlanningDataService, PlanningDay, PlanningStatic } from './planning-data.service';
import { TownService } from './town.service';
import { TownStatisticsService } from './town-statistics.service';

describe('PlanningDataService', (): void => {
    const plans: BuildingPlansDTO = { access: { isCitizen: true, canEdit: true }, plans: [], itemValues: {}, settingsVersion: 0 };
    const state: BuildingPlanStateDTO = { buildings: [], defense: null };
    const homes: HomeReferentialDTO = { levels: [], upgrades: [] };
    const upgrades: BuildingUpgradesDTO = { 'small_gather_#00': { maxLevel: 5 } };
    const item: Item = Object.assign(new Item(), { id: 5, bank_count: 3 });
    const citizen: Citizen = Object.assign(new Citizen(), { id: 1, name: 'A' });
    const expedition: Expedition = new Expedition();

    const get_plans: Mock<() => Observable<BuildingPlansDTO>> = vi.fn();
    const get_state: Mock<() => Observable<BuildingPlanStateDTO>> = vi.fn();
    const get_home_referential: Mock<() => Observable<HomeReferentialDTO>> = vi.fn();
    const get_upgrades: Mock<() => Observable<BuildingUpgradesDTO>> = vi.fn();
    const get_buildings: Mock<() => Observable<Building[]>> = vi.fn();
    const get_items: Mock<() => Observable<Item[]>> = vi.fn();
    const get_citizens: Mock<() => Observable<CitizenInfo>> = vi.fn();
    const get_bank: Mock<() => Observable<BankInfo>> = vi.fn();
    const get_expeditions: Mock<(day: number) => Observable<Expedition[]>> = vi.fn();
    const get_refinement: Mock<(day: number) => Observable<RefinementViewDTO>> = vi.fn();
    let service: PlanningDataService;

    beforeEach((): void => {
        vi.resetAllMocks();
        get_plans.mockReturnValue(of(plans));
        get_state.mockReturnValue(of(state));
        get_home_referential.mockReturnValue(of(homes));
        get_upgrades.mockReturnValue(of(upgrades));
        get_buildings.mockReturnValue(of([]));
        get_items.mockReturnValue(of([item]));
        get_citizens.mockReturnValue(of(Object.assign(new CitizenInfo(), { citizens: [citizen] })));
        get_bank.mockReturnValue(of(Object.assign(new BankInfo(), { items: [item] })));
        get_expeditions.mockReturnValue(of([expedition]));

        TestBed.configureTestingModule({
            providers: [
                { provide: BuildingPlanService, useValue: { getPlans: get_plans, getState: get_state, getHomeReferential: get_home_referential, getBuildingUpgrades: get_upgrades } },
                { provide: ApiService, useValue: { getBuildings: get_buildings, getItems: get_items } },
                { provide: TownService, useValue: { getCitizens: get_citizens, getBank: get_bank } },
                { provide: ExpeditionService, useValue: { getExpeditions: get_expeditions } },
                { provide: TownStatisticsService, useValue: { getRefinement: get_refinement } }
            ]
        });
        service = TestBed.inject(PlanningDataService);
    });

    it('loadStatic regroupe les huit sources', (): void => {
        let result: PlanningStatic | undefined;
        service.loadStatic().subscribe((loaded: PlanningStatic): void => {
            result = loaded;
        });

        expect(result?.plans).toBe(plans);
        expect(result?.state).toBe(state);
        expect(result?.homes).toBe(homes);
        expect(result?.buildings).toEqual([]);
        expect(result?.items).toEqual([item]);
        expect(result?.citizens).toEqual([citizen]);
        expect(result?.bank).toEqual([item]);
        expect(result?.upgrades).toBe(upgrades);
        expect(get_plans).toHaveBeenCalledTimes(1);
        expect(get_bank).toHaveBeenCalledTimes(1);
    });

    it('loadStatic émet même si les services ne complètent jamais leur flux', (): void => {
        const never_completing: <T>(value: T) => Observable<T> = <T>(value: T): Observable<T> => new Observable<T>((sub: Subscriber<T>): void => sub.next(value));
        get_plans.mockReturnValue(never_completing(plans));
        get_state.mockReturnValue(never_completing(state));
        get_home_referential.mockReturnValue(never_completing(homes));
        get_upgrades.mockReturnValue(never_completing(upgrades));
        get_buildings.mockReturnValue(never_completing<Building[]>([]));
        get_items.mockReturnValue(never_completing([item]));
        get_citizens.mockReturnValue(never_completing(Object.assign(new CitizenInfo(), { citizens: [citizen] })));
        get_bank.mockReturnValue(never_completing(Object.assign(new BankInfo(), { items: [item] })));
        let result: PlanningStatic | undefined;
        service.loadStatic().subscribe((loaded: PlanningStatic): void => {
            result = loaded;
        });

        expect(result?.citizens).toEqual([citizen]);
    });

    it('loadDay émet même si les expéditions ne complètent jamais leur flux', (): void => {
        get_expeditions.mockReturnValue(new Observable<Expedition[]>((sub: Subscriber<unknown>): void => sub.next([expedition])));
        get_refinement.mockReturnValue(new Observable<RefinementViewDTO>((sub: Subscriber<unknown>): void => sub.next(<RefinementViewDTO>{ attackMax: 1450 })));
        let result: PlanningDay | undefined;
        service.loadDay(10).subscribe((loaded: PlanningDay): void => {
            result = loaded;
        });

        expect(result?.attack).toBe(1450);
    });

    it('loadDay renvoie les expéditions et l\'attaque maximale de l\'affinage', (): void => {
        get_refinement.mockReturnValue(of(<RefinementViewDTO>{ attackMin: 1400, attackMax: 1450 }));
        let result: PlanningDay | undefined;
        service.loadDay(10).subscribe((loaded: PlanningDay): void => {
            result = loaded;
        });

        expect(get_expeditions).toHaveBeenCalledWith(10);
        expect(get_refinement).toHaveBeenCalledWith(10);
        expect(result?.expeditions).toEqual([expedition]);
        expect(result?.attack).toBe(1450);
    });

    it('loadDay retombe sur l\'attaque minimale quand le maximum est inconnu', (): void => {
        get_refinement.mockReturnValue(of(<RefinementViewDTO>{ attackMin: 1400, attackMax: null }));
        let attack: number | null | undefined;
        service.loadDay(10).subscribe((loaded: PlanningDay): void => {
            attack = loaded.attack;
        });

        expect(attack).toBe(1400);
    });

    it('loadDay renvoie une attaque nulle sans faire échouer les expéditions quand l\'affinage échoue', (): void => {
        const failing: Observable<RefinementViewDTO> = throwError((): Error => new Error('400'));
        get_refinement.mockReturnValue(failing);
        let result: PlanningDay | undefined;
        service.loadDay(10).subscribe((loaded: PlanningDay): void => {
            result = loaded;
        });

        expect(result?.attack).toBeNull();
        expect(result?.expeditions).toEqual([expedition]);
    });
});
