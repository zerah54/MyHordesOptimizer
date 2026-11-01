import { HttpErrorResponse, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { environment } from '../../../../environments/environment';
import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { AuthenticationService } from '../../../_abstract_model/services/authentication.service';
import { BuildingPlanService } from '../../../_abstract_model/services/building-plan.service';
import { PlanningDataService, PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { errorInterceptor } from '../../../_core/services/errors-interceptor.service';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { setTown } from '../../../_core/utilities/localstorage.util';
import {
    BuildingPlanContentDTO,
    BuildingPlanDTO,
    BuildingPlanRequestDTO,
    BuildingPlansDTO,
    emptyPlanContent,
    PlanTaskDTO,
    TownBuildingStateDTO
} from './plan.types';
import { BuildingRef } from './plan-evaluation.util';
import { PlanningStore } from './planning.store';
import { ToggleContext } from './program-edit.util';
import { TaskCheckService } from './task-check.service';

const TODAY: number = 10;

function wall(): Building {
    return new Building({
        id: 1, uid: 'wall', img: '', label: { fr: 'Mur' }, description: { fr: '' }, parentId: null, displayOrder: 0,
        pa: 40, defence: 30, maxLife: 30, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
        resources: [], hasHardMode: false, tier0Ap: null, tier1Ap: null, tier2Ap: null, tier0Resources: [], tier1Resources: [],
        hardBlueprintLevel: null, availability: {}
    });
}

function plan(overrides: Partial<BuildingPlanDTO> = {}): BuildingPlanDTO {
    return {
        id: 7, day: TODAY, name: 'Plan A', isEffective: true, version: 3, authorId: 9, authorName: 'Zerah',
        content: { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }] } },
        lastUpdateInfo: null, ...overrides
    };
}

function plans_dto(plans: BuildingPlanDTO[], can_edit: boolean = true): BuildingPlansDTO {
    return { access: { isCitizen: true, canEdit: can_edit }, plans, itemValues: { '5': 2 }, settingsVersion: 4 };
}

function static_data(plans: BuildingPlansDTO): PlanningStatic {
    return {
        plans,
        state: { buildings: [], defense: null },
        buildings: [wall()],
        items: [Object.assign(new Item(), { id: 5, uid: 'wood' })],
        homes: { levels: [], upgrades: [] },
        citizens: [Object.assign(new Citizen(), { id: 1, name: 'A', is_dead: false })],
        bank: []
    };
}

describe('PlanningStore', (): void => {
    const load_static: Mock<() => Observable<PlanningStatic>> = vi.fn();
    const load_day: Mock<(day: number) => Observable<PlanningDay>> = vi.fn();
    const get_plans: Mock<() => Observable<BuildingPlansDTO>> = vi.fn();
    const save_plan: Mock<(request: BuildingPlanRequestDTO) => Observable<BuildingPlanDTO>> = vi.fn();
    const delete_plan: Mock<(id: number) => Observable<void>> = vi.fn();
    const set_effective: Mock<(id: number) => Observable<BuildingPlanDTO>> = vi.fn();
    const save_settings: Mock<(request: { itemValues: Record<string, number>; version?: number | null }) => Observable<BuildingPlansDTO>> = vi.fn();
    let store: PlanningStore;

    function create(dto: BuildingPlansDTO = plans_dto([plan()])): PlanningStore {
        load_static.mockReturnValue(of(static_data(dto)));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: BuildingPlanService, useValue: { getPlans: get_plans, savePlan: save_plan, deletePlan: delete_plan, setEffective: set_effective, saveSettings: save_settings } }
            ]
        });
        const created: PlanningStore = TestBed.inject(PlanningStore);
        created.load();
        return created;
    }

    beforeEach((): void => {
        vi.resetAllMocks();
        TestBed.resetTestingModule();
        setTown(Object.assign(new TownDetails(), { town_id: 42, day: TODAY, town_type: 'RNE' }));
        load_day.mockImplementation((day: number): Observable<PlanningDay> => of({ expeditions: [], attack: 1000 + day }));
    });

    afterEach((): void => {
        setTown(null);
    });

    it('load : charge, sélectionne la proposition effective du jour et en fait une copie de travail', (): void => {
        store = create();

        expect(store.loading()).toBe(false);
        expect(store.selected_day()).toBe(TODAY);
        expect(store.plans_of_day().length).toBe(1);
        expect(store.selected_plan()?.id).toBe(7);
        expect(store.draft()).toEqual(plan().content);
        expect(store.draft()).not.toBe(store.selected_plan()?.content);
        expect(store.dirty()).toBe(false);
        expect(store.days()).toContain(TODAY);
        expect(store.days()).toContain(TODAY + 7);
    });

    it('propose toujours le jour suivant du jour affiché, sans limite dans le futur', (): void => {
        store = create();

        store.selectDay(TODAY + 7);
        expect(store.days()).toContain(TODAY + 8);

        store.selectDay(TODAY + 8);
        expect(store.days()).toContain(TODAY + 9);
    });

    it('load : les consignes sans identifiant en reçoivent un stable, sans marquer la copie comme modifiée', (): void => {
        const legacy: BuildingPlanDTO = plan({ content: { ...emptyPlanContent(), citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'x', pa: 0 }] }] } });
        store = create(plans_dto([legacy]));

        expect(store.draft()?.citizens[0].tasks[0].id).toBe('p7u1t0');
        expect(store.selected_plan()?.content.citizens[0].tasks[0].id).toBe('p7u1t0');
        expect(store.dirty()).toBe(false);
    });

    it('is_citizen reflète le droit de lecture renvoyé par l\'API', (): void => {
        store = create();
        expect(store.is_citizen()).toBe(true);

        TestBed.resetTestingModule();
        store = create({ ...plans_dto([plan()]), access: { isCitizen: false, canEdit: false } });
        expect(store.is_citizen()).toBe(false);
    });

    describe('poche des bannis', (): void => {
        function createWith(overrides: Partial<PlanningStatic>, dto: BuildingPlansDTO = plans_dto([plan()])): PlanningStore {
            load_static.mockReturnValue(of({ ...static_data(dto), ...overrides }));
            TestBed.configureTestingModule({
                providers: [
                    PlanningStore,
                    { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                    { provide: BuildingPlanService, useValue: { getPlans: get_plans, savePlan: save_plan, deletePlan: delete_plan, setEffective: set_effective, saveSettings: save_settings } }
                ]
            });
            const created: PlanningStore = TestBed.inject(PlanningStore);
            created.load();
            return created;
        }

        function slaveryData(): Partial<PlanningStatic> {
            const slavery: Building = wall();
            slavery.id = 2;
            slavery.uid = 'small_slave_#00';
            return {
                buildings: [wall(), slavery],
                state: { buildings: [{ buildingId: 2, isBuilt: true, paCurrent: 0, apRemaining: 0, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] }], defense: null }
            };
        }

        it('masquée par défaut sans banni ni BDE', (): void => {
            store = create();

            expect(store.banned_pool_shown()).toBe(false);
            expect(store.banned_pool_forced()).toBe(false);
            expect(store.visible_pools()).toEqual(['regular']);
        });

        it('l\'activation sur la copie de travail affiche la poche', (): void => {
            store = create();

            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.manageBanned = true;
            });

            expect(store.banned_pool_forced()).toBe(false);
            expect(store.visible_pools()).toEqual(['banned', 'regular']);
        });

        it('un citoyen banni impose l\'affichage', (): void => {
            store = createWith({ citizens: [Object.assign(new Citizen(), { id: 1, name: 'A', is_dead: false, is_shunned: true })] });

            expect(store.banned_pool_forced()).toBe(true);
            expect(store.visible_pools()).toEqual(['banned', 'regular']);
        });

        it('le BDE construit impose l\'affichage', (): void => {
            store = createWith(slaveryData());

            expect(store.banned_pool_forced()).toBe(true);
        });

        it('le BDE construit impose aussi l\'affichage d\'un jour passé, sans évaluation', (): void => {
            const past: BuildingPlanDTO = plan({ id: 8, day: TODAY - 1 });
            store = createWith(slaveryData(), plans_dto([plan(), past]));

            store.selectDay(TODAY - 1);

            expect(store.evaluation()).toBeNull();
            expect(store.banned_pool_forced()).toBe(true);
        });
    });

    it('synced_ids liste les chantiers présents dans l\'état synchronisé', (): void => {
        load_static.mockReturnValue(of({
            ...static_data(plans_dto([plan()])),
            state: { buildings: [{ buildingId: 1, isBuilt: false, paCurrent: 40, apRemaining: 40, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] }], defense: null }
        }));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: BuildingPlanService, useValue: {} }
            ]
        });
        const synced: PlanningStore = TestBed.inject(PlanningStore);

        synced.load();

        expect(Array.from(synced.synced_ids())).toEqual([1]);
    });

    describe('plannable_buildings', (): void => {
        function holyRain(): Building {
            return Object.assign(wall(), { id: 2, uid: 'small_novlamps_#00', label: { fr: 'Lampadaires' }, availability: { RNE: 'Disabled' } });
        }

        function loadWith(synced_ids: number[]): PlanningStore {
            load_static.mockReturnValue(of({
                ...static_data(plans_dto([plan()])),
                buildings: [wall(), holyRain()],
                state: {
                    buildings: synced_ids.map((id: number): TownBuildingStateDTO => (
                        { buildingId: id, isBuilt: false, paCurrent: 40, apRemaining: 40, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] })),
                    defense: null
                }
            }));
            TestBed.configureTestingModule({
                providers: [
                    PlanningStore,
                    { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                    { provide: BuildingPlanService, useValue: {} }
                ]
            });
            const loaded: PlanningStore = TestBed.inject(PlanningStore);
            loaded.load();
            return loaded;
        }

        it('masque un chantier désactivé pour le type de ville et absent de l\'état synchronisé', (): void => {
            const loaded: PlanningStore = loadWith([]);

            expect(loaded.plannable_buildings().map((building: BuildingRef): number => building.id)).toEqual([1]);
        });

        it('affiche un chantier désactivé pour le type de ville quand la ville l\'a (état synchronisé)', (): void => {
            const loaded: PlanningStore = loadWith([2]);

            expect(loaded.plannable_buildings().map((building: BuildingRef): number => building.id)).toEqual([1, 2]);
        });

        it('un chantier sans disponibilité connue reste proposé', (): void => {
            const loaded: PlanningStore = loadWith([]);

            expect(loaded.plannable_buildings().some((building: BuildingRef): boolean => building.id === 1)).toBe(true);
        });
    });

    describe('saisies différées', (): void => {
        afterEach((): void => {
            vi.useRealTimers();
        });

        it('deferEdit applique la modification après le délai', (): void => {
            vi.useFakeTimers();
            store = create();

            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });
            expect(store.draft()?.basePa).toBe(19);
            vi.advanceTimersByTime(400);

            expect(store.draft()?.basePa).toBe(25);
            expect(store.dirty()).toBe(true);
        });

        it('changer de proposition abandonne une saisie en attente au lieu de l\'appliquer à la nouvelle', (): void => {
            vi.useFakeTimers();
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]));

            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });
            store.selectPlan(8);
            vi.advanceTimersByTime(400);

            expect(store.draft()?.basePa).toBe(19);
            expect(store.dirty()).toBe(false);
        });

        it('save applique d\'abord les saisies en attente', (): void => {
            vi.useFakeTimers();
            store = create();
            save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 4, content: request.content })));

            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });
            store.save();

            expect(save_plan.mock.calls[0][0].content.basePa).toBe(25);
            expect(store.dirty()).toBe(false);
        });

        it('une modification faite pendant l\'envoi reste à enregistrer', (): void => {
            store = create();
            const response: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
            save_plan.mockReturnValue(response);
            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });

            store.save();
            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.basePa = 26;
            });
            response.next(plan({ version: 4 }));
            response.complete();

            expect(store.dirty()).toBe(true);
        });

        it('dupliquer envoie une copie nettoyée (consignes vides retirées)', (): void => {
            store = create();
            save_plan.mockReturnValue(of(plan({ id: 9 })));
            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.programs.regular.push({ kind: 'instruction', text: '  ' });
            });

            store.duplicatePlan('Copie');

            expect(save_plan.mock.calls[0][0].content.programs.regular).toEqual(plan().content.programs.regular);
        });
    });

    it('les valeurs d\'objets (réglage de la ville) s\'enregistrent aussi depuis un jour passé', (): void => {
        store = create();
        save_settings.mockReturnValue(of(plans_dto([plan()])));
        store.selectDay(TODAY - 1);

        expect(store.can_edit()).toBe(false);
        expect(store.can_edit_settings()).toBe(true);
        store.saveItemValues({ '5': 3 });
        expect(save_settings).toHaveBeenCalledTimes(1);
    });

    it('catalog expose le référentiel brut des chantiers', (): void => {
        store = create();
        expect(store.catalog().map((building: Building): number => building.id)).toEqual([1]);
    });

    it('toggle_context réunit parents, avancement de début de journée et pertes de la nuit', (): void => {
        store = create();
        const context: ToggleContext | null = store.toggle_context();
        expect(context?.parents.get(1)).toBeNull();
        expect(context?.progress.get(1)?.built).toBe(false);
        expect(context?.nightLoss.get(1)).toBe(0);
    });

    it('toggle_context est nul sans évaluation (jour passé)', (): void => {
        store = create();
        store.selectDay(TODAY - 1);
        expect(store.toggle_context()).toBeNull();
    });

    it('renamePlan enregistre le nouveau nom avec le contenu enregistré, sans toucher à la copie de travail', (): void => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> =>
            of(plan({ version: 4, name: request.name, content: request.content })));

        store.renamePlan('  Plan B  ');

        const request: BuildingPlanRequestDTO = save_plan.mock.calls[0][0];
        expect(request.id).toBe(7);
        expect(request.version).toBe(3);
        expect(request.name).toBe('Plan B');
        expect(request.content.basePa).toBe(19);
        expect(store.selected_plan()?.name).toBe('Plan B');
        expect(store.draft()?.basePa).toBe(25);
        expect(store.dirty()).toBe(true);
        expect(store.saving()).toBe(false);
    });

    it('renamePlan ignore un nom vide ou inchangé', (): void => {
        store = create();
        store.renamePlan('   ');
        store.renamePlan('Plan A');
        expect(save_plan).not.toHaveBeenCalled();
    });

    it('renamePlan refusé en 409 : recharge et signale le conflit', (): void => {
        store = create();
        save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })));
        get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob' })])));

        store.renamePlan('Plan B');

        expect(store.conflict()).toEqual({ author: 'Bob' });
        expect(store.saving()).toBe(false);
    });

    it('save retire les consignes vides avant l\'envoi', (): void => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.programs.regular.push({ kind: 'instruction', text: '   ' });
        });
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 4, content: request.content })));

        store.save();

        expect(save_plan.mock.calls[0][0].content.programs.regular).toEqual(plan().content.programs.regular);
    });

    it('homes expose les niveaux de maison du référentiel, ressources résolues', (): void => {
        load_static.mockReturnValue(of({
            ...static_data(plans_dto([plan()])),
            homes: { levels: [{ level: 2, label: 'Baracke', icon: '', def: 4, ap: 4, apUrbanism: 3, resources: [{ itemUid: 'wood', count: 1 }], resourcesUrbanism: [], buildingUid: null, allowsUpgrades: true, theft: false }], upgrades: [] }
        }));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: BuildingPlanService, useValue: {} }
            ]
        });
        const loaded: PlanningStore = TestBed.inject(PlanningStore);

        loaded.load();

        expect(loaded.homes().get(2)?.ap).toBe(4);
        expect(loaded.homes().get(2)?.resources).toEqual([{ itemId: 5, count: 1 }]);
    });

    it('load en échec : load_failed, sans exception', (): void => {
        load_static.mockReturnValue(throwError((): Error => new Error('500')));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: BuildingPlanService, useValue: {} }
            ]
        });
        const failing: PlanningStore = TestBed.inject(PlanningStore);

        failing.load();

        expect(failing.load_failed()).toBe(true);
        expect(failing.loading()).toBe(false);
    });

    it('updateDraft modifie la copie, rend dirty et recalcule l\'évaluation', (): void => {
        store = create();
        const before: number | undefined = store.evaluation()?.budgets.regular.budget;

        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 30;
        });

        expect(before).toBe(19);
        expect(store.evaluation()?.budgets.regular.budget).toBe(30);
        expect(store.dirty()).toBe(true);
        expect(store.selected_plan()?.content.basePa).toBe(19);
    });

    it('save envoie id, version, jour, nom et contenu, puis remet dirty à faux', (): void => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> =>
            of(plan({ version: 4, content: request.content })));

        store.save();

        const request: BuildingPlanRequestDTO = save_plan.mock.calls[0][0];
        expect(request.id).toBe(7);
        expect(request.version).toBe(3);
        expect(request.day).toBe(TODAY);
        expect(request.name).toBe('Plan A');
        expect(request.content.basePa).toBe(25);
        expect(store.selected_plan()?.version).toBe(4);
        expect(store.dirty()).toBe(false);
        expect(store.saving()).toBe(false);
    });

    it('save refusé en 409 : recharge, signale le conflit et garde la copie de travail', (): void => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });
        save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })));
        get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob', content: { ...emptyPlanContent(), basePa: 22 } })])));

        store.save();

        expect(get_plans).toHaveBeenCalledTimes(1);
        expect(store.conflict()).toEqual({ author: 'Bob' });
        expect(store.selected_plan()?.version).toBe(5);
        expect(store.draft()?.basePa).toBe(25);
        expect(store.dirty()).toBe(true);
        expect(store.saving()).toBe(false);

        store.dismissConflict();
        expect(store.conflict()).toBeNull();
    });

    it('save refusé en 409 à travers le vrai intercepteur : recharge et signale le conflit', (): void => {
        const error_snackbar: Mock = vi.fn();
        load_static.mockReturnValue(of(static_data(plans_dto([plan()]))));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                provideHttpClient(withXhr(), withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: AuthenticationService, useValue: {} },
                { provide: SnackbarService, useValue: { errorSnackbar: error_snackbar } }
            ]
        });
        const http_mock: HttpTestingController = TestBed.inject(HttpTestingController);
        store = TestBed.inject(PlanningStore);
        store.load();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });

        store.save();

        http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`)
            .flush('La proposition 7 a été modifiée entre-temps.', { status: 409, statusText: 'Conflict' });
        http_mock.expectOne(`${environment.api_url}/BuildingPlans/42`)
            .flush(plans_dto([plan({ version: 5, authorName: 'Bob' })]));

        expect(store.conflict()).toEqual({ author: 'Bob' });
        expect(store.selected_plan()?.version).toBe(5);
        expect(store.draft()?.basePa).toBe(25);
        expect(store.saving()).toBe(false);
        expect(error_snackbar).not.toHaveBeenCalled();
        http_mock.verify();
    });

    it('sans droit d\'écriture, aucune action n\'appelle l\'API ni ne modifie l\'état', (): void => {
        store = create(plans_dto([plan()], false));

        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 30;
        });
        store.save();
        store.createPlan('Nouveau');
        store.deletePlan();
        store.setEffective();
        store.saveItemValues({ '5': 3 });

        expect(store.can_edit()).toBe(false);
        expect(store.dirty()).toBe(false);
        expect(store.draft()?.basePa).toBe(19);
        expect(save_plan).not.toHaveBeenCalled();
        expect(delete_plan).not.toHaveBeenCalled();
        expect(set_effective).not.toHaveBeenCalled();
        expect(save_settings).not.toHaveBeenCalled();
    });

    it('selectDay charge les jours manquants une seule fois et chaîne les jours intermédiaires', (): void => {
        const next_day_plan: BuildingPlanDTO = plan({
            id: 8, day: TODAY + 1, version: 1,
            content: { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 10 }] } }
        });
        store = create(plans_dto([plan(), next_day_plan]));
        load_day.mockClear();

        store.selectDay(TODAY + 2);
        store.selectDay(TODAY + 2);

        expect(load_day.mock.calls.map((call: [number]): number => call[0]).sort()).toEqual([TODAY + 1, TODAY + 2]);
        expect(store.selected_plan()).toBeNull();
        expect(store.evaluation()).toBeNull();
    });

    it('selectDay sur un jour avec proposition : l\'évaluation reprend l\'avancement des jours précédents', (): void => {
        const day2: BuildingPlanDTO = plan({
            id: 8, day: TODAY + 1, version: 1,
            content: { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }] } }
        });
        store = create(plans_dto([plan({ content: { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 10 }] } } }), day2]));

        store.selectDay(TODAY + 1);

        expect(store.evaluation()?.results[0].points).toBe(10);
    });

    it('createPlan enregistre un contenu vide au jour sélectionné et sélectionne le plan créé', (): void => {
        store = create();
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> =>
            of(plan({ id: 9, name: request.name, isEffective: false, version: 0, content: request.content })));

        store.createPlan('Plan B');

        expect(save_plan.mock.calls[0][0].day).toBe(TODAY);
        expect(save_plan.mock.calls[0][0].content).toEqual(emptyPlanContent());
        expect(store.selected_plan()?.id).toBe(9);
        expect(store.plans_of_day().length).toBe(2);
    });

    it('deletePlan retire la proposition et en sélectionne une autre', (): void => {
        store = create(plans_dto([plan(), plan({ id: 9, name: 'Plan B', isEffective: false })]));
        delete_plan.mockReturnValue(of(undefined));

        store.deletePlan();

        expect(delete_plan).toHaveBeenCalledWith(7);
        expect(store.plans_of_day().map((p: BuildingPlanDTO): number => p.id)).toEqual([9]);
        expect(store.selected_plan()?.id).toBe(9);
    });

    it('setEffective met à jour l\'étoile de toutes les propositions du jour', (): void => {
        store = create(plans_dto([plan({ isEffective: false }), plan({ id: 9, name: 'Plan B', isEffective: true })]));
        store.selectPlan(7);
        set_effective.mockReturnValue(of(plan({ isEffective: true })));

        store.setEffective();

        expect(set_effective).toHaveBeenCalledWith(7);
        expect(store.plans_of_day().find((p: BuildingPlanDTO): boolean => p.id === 7)?.isEffective).toBe(true);
        expect(store.plans_of_day().find((p: BuildingPlanDTO): boolean => p.id === 9)?.isEffective).toBe(false);
    });

    it('saveItemValues envoie la version des réglages lue et met à jour les valeurs', (): void => {
        store = create();
        save_settings.mockReturnValue(of({ ...plans_dto([plan()]), itemValues: { '5': 3 }, settingsVersion: 5 }));

        store.saveItemValues({ '5': 3 });

        expect(save_settings).toHaveBeenCalledWith({ itemValues: { '5': 3 }, version: 4 });
        expect(store.item_values().get(5)).toBe(3);
    });

    it('un jour passé reste lisible mais n\'est pas évalué', (): void => {
        const past: BuildingPlanDTO = plan({ id: 3, day: TODAY - 2, isEffective: true });
        store = create(plans_dto([past, plan()]));

        store.selectDay(TODAY - 2);

        expect(store.days()).toContain(TODAY - 2);
        expect(store.selected_plan()?.id).toBe(3);
        expect(store.draft()).not.toBeNull();
        expect(store.evaluation()).toBeNull();
        expect(store.can_edit()).toBe(false);
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 30;
        });
        expect(store.dirty()).toBe(false);
        expect(store.draft()?.basePa).toBe(19);
    });

    describe('suivi des consignes', (): void => {
        const set_done: Mock<(citizen: Citizen, task: PlanTaskDTO, done: boolean, day: number) => Observable<void>> = vi.fn();

        /**
         * Galeries des Fouineurs.
         * @returns {Building} Chantier.
         */
        function gallery(): Building {
            return Object.assign(wall(), { id: 2, uid: 'small_gallery_#00', label: { fr: 'Galeries des Fouineurs' } });
        }

        /**
         * Store dont la ville a les Galeries (construites ou non) et une Cuisine au référentiel des améliorations.
         * @param {boolean} built Galeries construites.
         * @returns {PlanningStore} Store chargé.
         */
        function createWithTown(built: boolean): PlanningStore {
            load_static.mockReturnValue(of({
                ...static_data(plans_dto([plan()])),
                buildings: [wall(), gallery()],
                state: {
                    buildings: [{ buildingId: 2, isBuilt: built, paCurrent: 30, apRemaining: built ? 0 : 30, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] }],
                    defense: null
                },
                homes: { levels: [], upgrades: [{ name: 'kitchen', label: 'Küche', description: '', levels: [{ level: 1, ap: 6, resources: [] }, { level: 2, ap: 3, resources: [] }] }] },
                citizens: [
                    Object.assign(new Citizen(), { id: 1, name: 'A', is_dead: false, daily_actions: [] }),
                    Object.assign(new Citizen(), { id: 2, name: 'B', is_dead: true, daily_actions: [] })
                ]
            }));
            TestBed.configureTestingModule({
                providers: [
                    PlanningStore,
                    { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                    { provide: BuildingPlanService, useValue: { getPlans: get_plans, savePlan: save_plan, deletePlan: delete_plan, setEffective: set_effective, saveSettings: save_settings } },
                    { provide: TaskCheckService, useValue: { setDone: set_done } }
                ]
            });
            const created: PlanningStore = TestBed.inject(PlanningStore);
            created.load();
            return created;
        }

        it('citizens_full : citoyens vivants complets', (): void => {
            store = createWithTown(true);

            expect(store.citizens_full().map((citizen: Citizen): number => citizen.id)).toEqual([1]);
        });

        it('can_track : jour en cours seulement', (): void => {
            store = createWithTown(true);
            expect(store.can_track()).toBe(true);

            store.selectDay(TODAY + 1);
            expect(store.can_track()).toBe(false);
        });

        it('displayable_actions : actions des chantiers construits', (): void => {
            store = createWithTown(true);
            expect(store.displayable_actions().map((action: DailyActionEnum): string => action.key)).toContain('home_scavenge');

            TestBed.resetTestingModule();
            store = createWithTown(false);
            expect(store.displayable_actions().map((action: DailyActionEnum): string => action.key)).not.toContain('home_scavenge');
        });

        it('displayable_actions : seulement les actions sans chantier si aucun chantier n\'est synchronisé', (): void => {
            load_static.mockReturnValue(of(static_data(plans_dto([plan()]))));
            TestBed.configureTestingModule({
                providers: [
                    PlanningStore,
                    { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                    { provide: BuildingPlanService, useValue: { getPlans: get_plans, savePlan: save_plan, deletePlan: delete_plan, setEffective: set_effective, saveSettings: save_settings } }
                ]
            });
            store = TestBed.inject(PlanningStore);
            store.load();

            expect(store.displayable_actions().map((action: DailyActionEnum): string => action.key)).toEqual(['home_clean', 'home_rest']);
        });

        it('displayable_actions : chantier terminé par le programme du jour', (): void => {
            store = createWithTown(false);
            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.basePa = 200;
                content.programs.regular = [{ buildingId: 2, kind: 'build', targetRemaining: 0 }];
            });

            expect(store.displayable_actions().map((action: DailyActionEnum): string => action.key)).toContain('home_scavenge');
        });

        it('home_upgrades : améliorations du référentiel, libellé du site, niveaux et coûts', (): void => {
            store = createWithTown(true);

            expect(store.home_upgrades()).toEqual([{ key: 'kitchenLevel', label: 'Cuisine', max_level: 4, levels: [{ level: 1, ap: 6 }, { level: 2, ap: 3 }] }]);
        });

        it('setTaskDone : deux consignes de la même action ne s\'écrivent pas en parallèle', (): void => {
            set_done.mockReturnValue(new Subject<void>());
            store = createWithTown(true);
            const first: PlanTaskDTO = { id: 'a', kind: 'action', ref: 'home_scavenge', pa: 1 };
            const second: PlanTaskDTO = { id: 'b', kind: 'action', ref: 'home_scavenge', pa: 1 };

            store.setTaskDone(1, first, true);
            store.setTaskDone(1, second, true);

            expect(set_done).toHaveBeenCalledTimes(1);
            expect(store.isPending(1, second)).toBe(true);
            expect(store.isPending(1, { id: 'c', kind: 'free', pa: 0 })).toBe(false);
        });

        it('setTaskDone : écrit pour le jour affiché puis rafraîchit les citoyens', (): void => {
            set_done.mockReturnValue(of(undefined));
            store = createWithTown(true);
            const before: Citizen[] = store.citizens_full();
            const task: PlanTaskDTO = { id: 'f', kind: 'free', label: 'x', pa: 0 };

            store.setTaskDone(1, task, true);

            expect(set_done).toHaveBeenCalledWith(before[0], task, true, TODAY);
            expect(store.citizens_full()).not.toBe(before);
        });
    });
});
