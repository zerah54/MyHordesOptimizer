import { HttpErrorResponse, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, Subject, throwError } from 'rxjs';
import type { Mock, MockInstance } from 'vitest';

import { environment } from '../../../../environments/environment';
import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { PlanLockDTO, RealtimeBuildingPlansService } from '../../../_abstract_model/realtime-services/realtime-building-plans.service';
import { AuthenticationService } from '../../../_abstract_model/services/authentication.service';
import { BuildingPlanService } from '../../../_abstract_model/services/building-plan.service';
import { PlanningDataService, PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Me } from '../../../_abstract_model/types/me.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { errorInterceptor } from '../../../_core/services/errors-interceptor.service';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { setTown, setUser } from '../../../_core/utilities/localstorage.util';
import { BuildingRef, URBANISM_UID } from './plan-evaluation.util';
import {
    BuildingPlanContentDTO,
    BuildingPlanDTO,
    BuildingPlanRequestDTO,
    BuildingPlansDTO,
    emptyPlanContent,
    PlanTaskDTO,
    TownBuildingStateDTO
} from './plan.types';
import { AUTOSAVE_DELAY_MS, AUTOSAVE_MAX_WAIT_MS, PlanningStore } from './planning.store';
import { ToggleContext } from './program-edit.util';
import { TaskCheckService } from './task-check.service';

const TODAY: number = 10;
/** Joueur connecté. */
const ME: number = 1;

/** Doublure du hub de la page : flux à déclencher à la main, appels espionnés. */
interface FakeRealtime {
    plan_saved$: Subject<BuildingPlanDTO>;
    plan_deleted$: Subject<number>;
    plan_effective_changed$: Subject<BuildingPlanDTO>;
    settings_saved$: Subject<BuildingPlansDTO>;
    plan_lock_changed$: Subject<PlanLockDTO>;
    task_checks_changed$: Subject<number>;
    reconnected$: Subject<void>;
    connectionId: Mock<() => string | null>;
    acquirePlanLock: Mock<(plan_id: number) => Promise<PlanLockDTO>>;
    takePlanLock: Mock<(plan_id: number) => Promise<PlanLockDTO>>;
    releasePlanLock: Mock<(plan_id: number) => Promise<void>>;
    getPlanLocks: Mock<() => Promise<PlanLockDTO[]>>;
    ensureTown: Mock<() => Promise<void>>;
    notifyTaskChecks: Mock<(user_id: number) => Promise<void>>;
}

/**
 * Main tenue par cette connexion.
 * @param {number} plan_id Proposition.
 * @param {string} connection_id Connexion du joueur.
 * @returns {PlanLockDTO} Verrou.
 */
function mineLock(plan_id: number, connection_id: string = 'conn-me'): PlanLockDTO {
    return { planId: plan_id, holderUserId: ME, holderConnectionId: connection_id };
}

/**
 * Main tenue par Bob.
 * @param {number} plan_id Proposition.
 * @returns {PlanLockDTO} Verrou.
 */
function bobLock(plan_id: number): PlanLockDTO {
    return { planId: plan_id, holderUserId: 2, holderConnectionId: 'conn-bob' };
}

/**
 * Hub qui accorde toujours la main à la connexion `conn-me`.
 * @returns {FakeRealtime} Doublure.
 */
function fakeRealtime(): FakeRealtime {
    return {
        plan_saved$: new Subject<BuildingPlanDTO>(),
        plan_deleted$: new Subject<number>(),
        plan_effective_changed$: new Subject<BuildingPlanDTO>(),
        settings_saved$: new Subject<BuildingPlansDTO>(),
        plan_lock_changed$: new Subject<PlanLockDTO>(),
        task_checks_changed$: new Subject<number>(),
        reconnected$: new Subject<void>(),
        connectionId: vi.fn((): string | null => 'conn-me'),
        acquirePlanLock: vi.fn((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id))),
        takePlanLock: vi.fn((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id))),
        releasePlanLock: vi.fn((): Promise<void> => Promise.resolve()),
        getPlanLocks: vi.fn((): Promise<PlanLockDTO[]> => Promise.resolve([])),
        ensureTown: vi.fn((): Promise<void> => Promise.resolve()),
        notifyTaskChecks: vi.fn((): Promise<void> => Promise.resolve())
    };
}

/** Laisse aboutir les promesses en attente (prise de main, enregistrement). */
async function settle(): Promise<void> {
    if (vi.isFakeTimers()) {
        await vi.advanceTimersByTimeAsync(0);
    } else {
        await new Promise<void>((resolve: () => void): void => {
            setTimeout(resolve);
        });
    }
}

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
        bank: [],
        upgrades: {},
        item_emotes: {}
    };
}

describe('PlanningStore', (): void => {
    const load_static: Mock<() => Observable<PlanningStatic>> = vi.fn();
    const load_day: Mock<(day: number) => Observable<PlanningDay>> = vi.fn();
    const get_plans: Mock<() => Observable<BuildingPlansDTO>> = vi.fn();
    const save_plan: Mock<(request: BuildingPlanRequestDTO, connection_id: string | null) => Observable<BuildingPlanDTO>> = vi.fn();
    const delete_plan: Mock<(id: number, connection_id: string | null) => Observable<void>> = vi.fn();
    const set_effective: Mock<(id: number, connection_id: string | null) => Observable<BuildingPlanDTO>> = vi.fn();
    const save_settings: Mock<(request: { itemValues: Record<string, number>; version?: number | null }, connection_id: string | null) => Observable<BuildingPlansDTO>> = vi.fn();
    const get_citizen: Mock<(id: number) => Observable<Citizen>> = vi.fn();
    let realtime: FakeRealtime;
    let snackbar: { warningSnackbar: Mock<(message: string) => void> };
    let store: PlanningStore;

    /** Doublures communes : hub de la page, notifications, relecture d'un citoyen. */
    function fakes(): Provider[] {
        return [
            { provide: RealtimeBuildingPlansService, useValue: realtime },
            { provide: SnackbarService, useValue: snackbar },
            { provide: TownService, useValue: { getCitizen: get_citizen } }
        ];
    }

    function create(dto: BuildingPlansDTO = plans_dto([plan()]), data: Partial<PlanningStatic> = {}): PlanningStore {
        load_static.mockReturnValue(of({ ...static_data(dto), ...data }));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                ...fakes(),
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
        setUser(Object.assign(new Me(), { id: ME }));
        load_day.mockImplementation((day: number): Observable<PlanningDay> => of({ expeditions: [], attack: 1000 + day }));
        // Écritures sans réponse par défaut : la sortie du store (destruction du module) peut encore enregistrer.
        save_plan.mockReturnValue(NEVER);
        get_plans.mockReturnValue(NEVER);
        realtime = fakeRealtime();
        snackbar = { warningSnackbar: vi.fn() };
    });

    afterEach((): void => {
        setTown(null);
        setUser(null);
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
                    ...fakes(),
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
                ...fakes(),
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
                    ...fakes(),
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

        it('save applique d\'abord les saisies en attente', async (): Promise<void> => {
            vi.useFakeTimers();
            store = create();
            save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 4, content: request.content })));

            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });
            store.save();
            await settle();

            expect(save_plan.mock.calls[0][0].content.basePa).toBe(25);
            expect(store.dirty()).toBe(false);
        });

        it('une modification faite pendant l\'envoi reste à enregistrer', async (): Promise<void> => {
            store = create();
            const response: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
            save_plan.mockReturnValue(response);
            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });

            store.save();
            await settle();
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

    it('renamePlan prend la main puis enregistre le nouveau nom avec le contenu enregistré, sans toucher à la copie de travail', async (): Promise<void> => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> =>
            of(plan({ version: 4, name: request.name, content: request.content })));

        store.renamePlan('  Plan B  ');
        await settle();

        expect(realtime.acquirePlanLock.mock.invocationCallOrder[0]).toBeLessThan(save_plan.mock.invocationCallOrder[0]);
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

    it('renamePlan refusé en 409 : recharge et signale le conflit', async (): Promise<void> => {
        store = create();
        save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })));
        get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob' })])));

        store.renamePlan('Plan B');
        await settle();

        expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });
        expect(store.saving()).toBe(false);
    });

    it('save retire les consignes vides avant l\'envoi', async (): Promise<void> => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.programs.regular.push({ kind: 'instruction', text: '   ' });
        });
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 4, content: request.content })));

        store.save();
        await settle();

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
                ...fakes(),
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: BuildingPlanService, useValue: {} }
            ]
        });
        const loaded: PlanningStore = TestBed.inject(PlanningStore);

        loaded.load();

        expect(loaded.homes().get(2)?.ap).toBe(4);
        expect(loaded.homes().get(2)?.resources).toEqual([{ itemId: 5, count: 1 }]);
    });

    it('homes : avec le Plan d\'urbanisme construit, les niveaux de maison portent les PA et ressources Urbanisme', (): void => {
        const urbanism: Building = new Building({
            id: 6, uid: URBANISM_UID, img: '', label: { fr: 'Plan d\'urbanisme' }, description: { fr: '' }, parentId: null, displayOrder: 0,
            pa: 40, defence: 0, maxLife: 0, breakable: false, temporary: false, hasUpgrade: false, rarity: 0,
            resources: [], hasHardMode: false, tier0Ap: null, tier1Ap: null, tier2Ap: null, tier0Resources: [], tier1Resources: [],
            hardBlueprintLevel: null, availability: {}
        });
        load_static.mockReturnValue(of({
            ...static_data(plans_dto([plan()])),
            buildings: [wall(), urbanism],
            state: { buildings: [{ buildingId: 6, isBuilt: true, paCurrent: null, apRemaining: null, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] }], defense: null },
            homes: { levels: [{ level: 2, label: 'Baracke', icon: '', def: 4, ap: 4, apUrbanism: 3, resources: [{ itemUid: 'wood', count: 1 }], resourcesUrbanism: [{ itemUid: 'wood', count: 2 }], buildingUid: null, allowsUpgrades: true, theft: false }], upgrades: [] }
        }));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                ...fakes(),
                { provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } },
                { provide: BuildingPlanService, useValue: {} }
            ]
        });
        const loaded: PlanningStore = TestBed.inject(PlanningStore);

        loaded.load();

        expect(loaded.homes().get(2)?.ap).toBe(3);
        expect(loaded.homes().get(2)?.resources).toEqual([{ itemId: 5, count: 2 }]);
    });

    it('load en échec : load_failed, sans exception', (): void => {
        load_static.mockReturnValue(throwError((): Error => new Error('500')));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                ...fakes(),
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

    it('save envoie id, version, jour, nom et contenu, puis remet dirty à faux', async (): Promise<void> => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });
        save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> =>
            of(plan({ version: 4, content: request.content })));

        store.save();
        await settle();

        const request: BuildingPlanRequestDTO = save_plan.mock.calls[0][0];
        expect(request.id).toBe(7);
        expect(request.version).toBe(3);
        expect(request.day).toBe(TODAY);
        expect(request.name).toBe('Plan A');
        expect(request.content.basePa).toBe(25);
        expect(save_plan.mock.calls[0][1]).toBe('conn-me');
        expect(store.selected_plan()?.version).toBe(4);
        expect(store.dirty()).toBe(false);
        expect(store.saving()).toBe(false);
    });

    it('save refusé en 409 : recharge, signale le conflit et garde la copie de travail', async (): Promise<void> => {
        store = create();
        store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.basePa = 25;
        });
        save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })));
        get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob', content: { ...emptyPlanContent(), basePa: 22 } })])));

        store.save();
        await settle();

        expect(get_plans).toHaveBeenCalledTimes(1);
        expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });
        expect(store.selected_plan()?.version).toBe(5);
        expect(store.draft()?.basePa).toBe(25);
        expect(store.dirty()).toBe(true);
        expect(store.saving()).toBe(false);

        store.dismissConflict();
        expect(store.conflict()).toBeNull();
    });

    it('save refusé en 409 à travers le vrai intercepteur : recharge et signale le conflit', async (): Promise<void> => {
        const error_snackbar: Mock = vi.fn();
        load_static.mockReturnValue(of(static_data(plans_dto([plan()]))));
        TestBed.configureTestingModule({
            providers: [
                PlanningStore,
                ...fakes(),
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
        await settle();

        http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`)
            .flush('La proposition 7 a été modifiée entre-temps.', { status: 409, statusText: 'Conflict' });
        http_mock.expectOne(`${environment.api_url}/BuildingPlans/42`)
            .flush(plans_dto([plan({ version: 5, authorName: 'Bob' })]));

        expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });
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
        expect(save_plan.mock.calls[0][1]).toBe('conn-me');
        expect(store.selected_plan()?.id).toBe(9);
        expect(store.plans_of_day().length).toBe(2);
    });

    it('deletePlan retire la proposition et en sélectionne une autre', async (): Promise<void> => {
        store = create(plans_dto([plan(), plan({ id: 9, name: 'Plan B', isEffective: false })]));
        delete_plan.mockReturnValue(of(undefined));

        store.deletePlan();
        await settle();

        expect(delete_plan).toHaveBeenCalledWith(7, 'conn-me');
        expect(store.plans_of_day().map((p: BuildingPlanDTO): number => p.id)).toEqual([9]);
        expect(store.selected_plan()?.id).toBe(9);
    });

    it('setEffective met à jour l\'étoile de toutes les propositions du jour', (): void => {
        store = create(plans_dto([plan({ isEffective: false }), plan({ id: 9, name: 'Plan B', isEffective: true })]));
        store.selectPlan(7);
        set_effective.mockReturnValue(of(plan({ isEffective: true })));

        store.setEffective();

        expect(set_effective).toHaveBeenCalledWith(7, 'conn-me');
        expect(store.plans_of_day().find((p: BuildingPlanDTO): boolean => p.id === 7)?.isEffective).toBe(true);
        expect(store.plans_of_day().find((p: BuildingPlanDTO): boolean => p.id === 9)?.isEffective).toBe(false);
    });

    it('saveItemValues envoie la version des réglages lue et met à jour les valeurs', (): void => {
        store = create();
        save_settings.mockReturnValue(of({ ...plans_dto([plan()]), itemValues: { '5': 3 }, settingsVersion: 5 }));

        store.saveItemValues({ '5': 3 });

        expect(save_settings).toHaveBeenCalledWith({ itemValues: { '5': 3 }, version: 4 }, 'conn-me');
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
                    ...fakes(),
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
                    ...fakes(),
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

        it('après une coche acceptée, signale le citoyen aux autres', (): void => {
            set_done.mockReturnValue(of(undefined));
            store = createWithTown(true);

            store.setTaskDone(1, { id: 'f', kind: 'free', label: 'x', pa: 0 }, true);

            expect(realtime.notifyTaskChecks).toHaveBeenCalledWith(1);
        });

        it('ne signale rien quand l\'écriture de la coche échoue', (): void => {
            set_done.mockReturnValue(throwError((): Error => new Error('refusé')));
            store = createWithTown(true);

            store.setTaskDone(1, { id: 'f', kind: 'free', label: 'x', pa: 0 }, true);

            expect(realtime.notifyTaskChecks).not.toHaveBeenCalled();
        });

        it('un signalement qui échoue n\'est pas une erreur non gérée', async (): Promise<void> => {
            const warnings: MockInstance<typeof console.warn> = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
            realtime.notifyTaskChecks.mockRejectedValue(new Error('hub coupé'));
            set_done.mockReturnValue(of(undefined));
            store = createWithTown(true);

            store.setTaskDone(1, { id: 'f', kind: 'free', label: 'x', pa: 0 }, true);
            await settle();

            expect(warnings).toHaveBeenCalledWith('NotifyTaskChecks', expect.any(Error));
            warnings.mockRestore();
        });
    });

    describe('main, enregistrement automatique et temps réel', (): void => {
        /** Citoyens de la ville avec Bob, qui peut tenir la main. */
        const with_bob: Partial<PlanningStatic> = {
            citizens: [Object.assign(new Citizen(), { id: ME, name: 'A', is_dead: false }), Object.assign(new Citizen(), { id: 2, name: 'Bob', is_dead: false })]
        };
        /** Proposition 7 enregistrée par Bob, telle que relue après un conflit. */
        const bob_version: BuildingPlanDTO = plan({ version: 4, authorName: 'Bob', content: { ...emptyPlanContent(), basePa: 22 } });

        /**
         * Modifie le PA de base de la copie de travail.
         * @param {number} value Nouvelle valeur.
         */
        function edit(value: number = 25): void {
            store.updateDraft((content: BuildingPlanContentDTO): void => {
                content.basePa = value;
            });
        }

        /** Enregistrements acceptés : version 4, contenu envoyé. */
        function acceptSaves(): void {
            save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 4, content: request.content })));
        }

        let warn: MockInstance<typeof console.warn> | null = null;

        /**
         * Tait les avertissements attendus du test (échecs techniques simulés).
         * @returns {MockInstance<typeof console.warn>} Espion, pour les vérifier.
         */
        function expectWarnings(): MockInstance<typeof console.warn> {
            warn = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
            return warn;
        }

        /** Détruit le store tant que les avertissements sont tus : sa sortie retente la prise de main. */
        async function destroyStore(): Promise<void> {
            TestBed.resetTestingModule();
            await settle();
        }

        beforeEach((): void => {
            vi.useFakeTimers();
        });

        afterEach((): void => {
            vi.useRealTimers();
            warn?.mockRestore();
            warn = null;
        });

        it('prend la main à la première modification', async (): Promise<void> => {
            store = create();
            expect(store.lock()).toEqual({ kind: 'free' });

            edit(25);
            edit(26);
            await settle();

            expect(realtime.acquirePlanLock).toHaveBeenCalledTimes(1);
            expect(realtime.acquirePlanLock).toHaveBeenCalledWith(7);
            expect(store.lock()).toEqual({ kind: 'mine' });
            expect(store.can_edit()).toBe(true);
            expect(store.save_state()).toBe('pending');
        });

        it('annule la modification, recharge la proposition et passe en lecture seule si la main est refusée', async (): Promise<void> => {
            realtime.acquirePlanLock.mockResolvedValue(bobLock(7));
            store = create(plans_dto([plan()]), with_bob);
            get_plans.mockReturnValue(of(plans_dto([bob_version])));

            edit();
            await settle();

            expect(get_plans).toHaveBeenCalledTimes(1);
            expect(store.draft()?.basePa).toBe(22);
            expect(store.selected_plan()?.version).toBe(4);
            expect(store.dirty()).toBe(false);
            expect(store.lock()).toEqual({ kind: 'other', userId: 2, sameUser: false });
            expect(store.can_edit()).toBe(false);
            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Bob modifie déjà cette proposition');
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).not.toHaveBeenCalled();
        });

        it('garde la modification si la prise de main échoue techniquement', async (): Promise<void> => {
            const warnings: MockInstance<typeof console.warn> = expectWarnings();
            realtime.acquirePlanLock.mockRejectedValue(new Error('hub coupé'));
            store = create();

            edit();
            await settle();

            expect(store.draft()?.basePa).toBe(25);
            expect(store.dirty()).toBe(true);
            expect(store.save_state()).toBe('error');
            expect(store.lock()).toEqual({ kind: 'free' });
            expect(snackbar.warningSnackbar).not.toHaveBeenCalled();
            expect(warnings).toHaveBeenCalledWith('AcquirePlanLock', expect.any(Error));
            await destroyStore();
        });

        it('enregistre 2 s après la dernière modification, une seule fois pour plusieurs modifications rapprochées', async (): Promise<void> => {
            store = create();
            acceptSaves();

            edit(25);
            await vi.advanceTimersByTimeAsync(1500);
            edit(26);
            await vi.advanceTimersByTimeAsync(1500);
            expect(save_plan).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(500);

            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(save_plan.mock.calls[0][0].content.basePa).toBe(26);
            expect(store.dirty()).toBe(false);
            expect(store.save_state()).toBe('saved');
        });

        it('une saisie continue s\'enregistre au plus tard 10 s après la première modification, pour garder la main', async (): Promise<void> => {
            store = create();
            acceptSaves();

            for (let value: number = 30; value < 41; value++) {
                edit(value);
                await vi.advanceTimersByTimeAsync(1000);
            }

            expect(AUTOSAVE_MAX_WAIT_MS).toBe(10000);
            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(save_plan.mock.calls[0][0].content.basePa).toBe(39);
        });

        it('un 423 à l\'enregistrement passe en lecture seule et recharge la proposition ; la bannière nomme le détenteur', async (): Promise<void> => {
            store = create(plans_dto([plan()]), with_bob);
            save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 423 })));
            realtime.getPlanLocks.mockResolvedValue([bobLock(7)]);
            // Dernier enregistrement par le joueur lui-même : la bannière doit nommer celui qui a la main, pas l'auteur.
            get_plans.mockReturnValue(of(plans_dto([{ ...bob_version, authorName: 'A' }])));

            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            await settle();

            expect(store.lock()).toEqual({ kind: 'other', userId: 2, sameUser: false });
            expect(store.can_edit()).toBe(false);
            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: false });
            expect(store.draft()?.basePa).toBe(22);
            expect(store.dirty()).toBe(false);
            expect(store.saving()).toBe(false);
        });

        it('sous sa main sans modification en attente, adopte la proposition enregistrée par un autre (brouillon et version)', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit(25);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(store.dirty()).toBe(false);

            realtime.plan_saved$.next(plan({ version: 9, content: { ...emptyPlanContent(), basePa: 40 } }));

            expect(store.draft()?.basePa).toBe(40);
            expect(store.selected_plan()?.version).toBe(9);
            edit(26);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).toHaveBeenCalledTimes(2);
            expect(save_plan.mock.calls[1][0].version).toBe(9);
        });

        it('sous sa main avec une modification en attente, ignore un PlanSaved reçu : le brouillon part avec sa version de base', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit(25);
            await settle();
            expect(store.lock()).toEqual({ kind: 'mine' });

            realtime.plan_saved$.next(plan({ version: 9, content: { ...emptyPlanContent(), basePa: 40 } }));

            expect(store.draft()?.basePa).toBe(25);
            expect(store.selected_plan()?.version).toBe(3);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan.mock.calls[0][0].version).toBe(3);
        });

        it('une saisie encore dans son délai compte comme modification en attente quand un autre enregistre', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit(25);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 30;
            });

            realtime.plan_saved$.next(plan({ version: 9, content: { ...emptyPlanContent(), basePa: 40 } }));

            expect(store.draft()?.basePa).toBe(30);
            expect(store.selected_plan()?.version).toBe(4);
            expect(store.dirty()).toBe(true);
        });

        it('remplace la proposition affichée quand un autre l\'enregistre', (): void => {
            store = create();

            realtime.plan_saved$.next(plan({ version: 4, name: 'Plan A2', content: { ...emptyPlanContent(), basePa: 30 } }));

            expect(store.selected_plan()?.version).toBe(4);
            expect(store.selected_plan()?.name).toBe('Plan A2');
            expect(store.draft()?.basePa).toBe(30);
            expect(store.dirty()).toBe(false);
        });

        it('garde la version de base d\'une modification en attente quand un autre enregistre avant qu\'on ait la main', async (): Promise<void> => {
            expectWarnings();
            realtime.acquirePlanLock.mockRejectedValue(new Error('hub coupé'));
            store = create();
            edit();
            await settle();

            realtime.plan_saved$.next(plan({ version: 4, content: { ...emptyPlanContent(), basePa: 30 } }));

            expect(store.selected_plan()?.version).toBe(3);
            expect(store.draft()?.basePa).toBe(25);
            await destroyStore();
        });

        it('sous une modification en attente sans la main, une proposition rendue effective ailleurs ne change que l\'étoile', async (): Promise<void> => {
            expectWarnings();
            realtime.acquirePlanLock.mockRejectedValue(new Error('hub coupé'));
            store = create(plans_dto([plan({ isEffective: false }), plan({ id: 9, name: 'Plan B', isEffective: true })]));
            store.selectPlan(7);
            edit();
            await settle();

            realtime.plan_effective_changed$.next(plan({ version: 4, content: { ...emptyPlanContent(), basePa: 30 } }));

            expect(store.selected_plan()?.isEffective).toBe(true);
            expect(store.selected_plan()?.version).toBe(3);
            expect(store.selected_plan()?.content.basePa).toBe(19);
            expect(store.draft()?.basePa).toBe(25);
            await destroyStore();
        });

        it('prévient quand la proposition en cours de modification est supprimée par un autre', async (): Promise<void> => {
            expectWarnings();
            realtime.acquirePlanLock.mockRejectedValue(new Error('hub coupé'));
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]));
            edit();
            await settle();

            realtime.plan_deleted$.next(7);

            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Cette proposition a été supprimée');
            expect(store.selected_plan()?.id).toBe(8);
            await destroyStore();
        });

        it('prévient aussi quand seule une saisie en attente est perdue par la suppression', (): void => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]));
            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 30;
            });

            realtime.plan_deleted$.next(7);

            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Cette proposition a été supprimée');
            expect(store.selected_plan()?.id).toBe(8);
        });

        it('bascule sur une autre proposition du jour quand la sélection est supprimée par un autre', (): void => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]));

            realtime.plan_deleted$.next(7);

            expect(store.plans_of_day().map((candidate: BuildingPlanDTO): number => candidate.id)).toEqual([8]);
            expect(store.selected_plan()?.id).toBe(8);
            expect(store.draft()).toEqual(plan({ id: 8 }).content);
        });

        it('la suppression d\'une autre proposition par un autre garde la copie de travail', (): void => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]));
            edit();

            realtime.plan_deleted$.next(8);

            expect(store.selected_plan()?.id).toBe(7);
            expect(store.draft()?.basePa).toBe(25);
            expect(store.dirty()).toBe(true);
        });

        it('après une reconnexion avec modifications en attente, reprend la main puis enregistre', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit();
            await settle();
            expect(store.lock()).toEqual({ kind: 'mine' });

            // Nouvelle connexion : l'ancienne main a été libérée par le serveur.
            realtime.connectionId.mockReturnValue('conn-me-2');
            realtime.acquirePlanLock.mockImplementation((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id, 'conn-me-2')));
            realtime.getPlanLocks.mockResolvedValue([mineLock(7, 'conn-me-2')]);
            realtime.reconnected$.next();
            await settle();

            expect(realtime.acquirePlanLock).toHaveBeenCalledTimes(2);
            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(realtime.acquirePlanLock.mock.invocationCallOrder[1]).toBeLessThan(save_plan.mock.invocationCallOrder[0]);
            expect(store.dirty()).toBe(false);
            expect(store.lock()).toEqual({ kind: 'mine' });
        });

        it('après une reconnexion, reprend la main encore tenue par sa propre connexion d\'avant la coupure, puis enregistre', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit();
            await settle();
            expect(store.lock()).toEqual({ kind: 'mine' });

            // Coupure brutale : le serveur garde l'ancienne connexion, et sa main, jusqu'à son expiration.
            realtime.connectionId.mockReturnValue('conn-me-2');
            realtime.acquirePlanLock.mockImplementation((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id, 'conn-me')));
            realtime.takePlanLock.mockImplementation((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id, 'conn-me-2')));
            realtime.getPlanLocks.mockResolvedValue([mineLock(7, 'conn-me-2')]);
            realtime.reconnected$.next();
            await settle();

            expect(realtime.takePlanLock).toHaveBeenCalledWith(7);
            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(realtime.takePlanLock.mock.invocationCallOrder[0]).toBeLessThan(save_plan.mock.invocationCallOrder[0]);
            expect(store.lock()).toEqual({ kind: 'mine' });
            expect(store.dirty()).toBe(false);
            expect(store.conflict()).toBeNull();
            expect(snackbar.warningSnackbar).not.toHaveBeenCalled();
        });

        it('après une reconnexion, ne reprend pas d\'office la main tenue par un autre onglet du joueur', async (): Promise<void> => {
            store = create();
            edit();
            await settle();

            const other_tab: PlanLockDTO = { planId: 7, holderUserId: ME, holderConnectionId: 'conn-other-tab' };
            realtime.connectionId.mockReturnValue('conn-me-2');
            realtime.acquirePlanLock.mockResolvedValue(other_tab);
            realtime.getPlanLocks.mockResolvedValue([other_tab]);
            realtime.reconnected$.next();
            await settle();

            expect(realtime.takePlanLock).not.toHaveBeenCalled();
            expect(save_plan).not.toHaveBeenCalled();
            expect(store.lock()).toEqual({ kind: 'other', userId: ME, sameUser: true });
        });

        it('hub coupé : garde la modification sans l\'envoyer, puis l\'enregistre à la reconnexion', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit();
            await settle();
            realtime.connectionId.mockReturnValue(null);

            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).not.toHaveBeenCalled();
            expect(store.save_state()).toBe('error');
            expect(store.draft()?.basePa).toBe(25);

            realtime.connectionId.mockReturnValue('conn-me-2');
            realtime.acquirePlanLock.mockImplementation((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id, 'conn-me-2')));
            realtime.reconnected$.next();
            await settle();

            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(store.save_state()).toBe('saved');
        });

        it('une saisie encore dans son attente de 400 ms à la reconnexion est enregistrée, pas effacée par la relecture', async (): Promise<void> => {
            store = create();
            acceptSaves();
            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 30;
            });

            realtime.connectionId.mockReturnValue('conn-me-2');
            realtime.acquirePlanLock.mockImplementation((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id, 'conn-me-2')));
            realtime.reconnected$.next();
            await settle();

            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(save_plan.mock.calls[0][0].content.basePa).toBe(30);
            expect(store.draft()?.basePa).toBe(30);
        });

        it('créer une proposition enregistre d\'abord celle qu\'on quitte, puis en libère la main', async (): Promise<void> => {
            store = create();
            save_plan.mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => (request.id === undefined || request.id === null
                ? of(plan({ id: 9, name: 'Plan B', isEffective: false, version: 0, content: request.content }))
                : of(plan({ version: 4, content: request.content }))));
            edit();
            await settle();

            store.createPlan('Plan B');
            await settle();

            const saved: BuildingPlanRequestDTO | undefined = save_plan.mock.calls.map((call: [BuildingPlanRequestDTO, string | null]): BuildingPlanRequestDTO => call[0])
                .find((request: BuildingPlanRequestDTO): boolean => request.id === 7);
            expect(saved?.content.basePa).toBe(25);
            expect(store.selected_plan()?.id).toBe(9);
            expect(realtime.releasePlanLock).toHaveBeenCalledWith(7);
            expect(realtime.releasePlanLock.mock.invocationCallOrder[0]).toBeGreaterThan(save_plan.mock.invocationCallOrder[save_plan.mock.calls.length - 1]);
        });

        it('une sauvegarde partie entre la nouvelle connexion et reconnected$ reprend d\'abord la main', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit();
            await settle();

            realtime.connectionId.mockReturnValue('conn-me-2');
            realtime.acquirePlanLock.mockImplementation((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id, 'conn-me-2')));
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            await settle();

            expect(realtime.acquirePlanLock).toHaveBeenCalledTimes(2);
            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(realtime.acquirePlanLock.mock.invocationCallOrder[1]).toBeLessThan(save_plan.mock.invocationCallOrder[0]);
            expect(store.conflict()).toBeNull();
        });

        it('après une reconnexion sans modification en attente, relit les propositions et les mains', async (): Promise<void> => {
            store = create(plans_dto([plan()]), with_bob);
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 4, content: { ...emptyPlanContent(), basePa: 30 } })])));
            realtime.getPlanLocks.mockResolvedValue([bobLock(7)]);

            realtime.reconnected$.next();
            await settle();

            expect(store.selected_plan()?.version).toBe(4);
            expect(store.draft()?.basePa).toBe(30);
            expect(store.lock()).toEqual({ kind: 'other', userId: 2, sameUser: false });
        });

        it('un enregistrement parti après une reprise de main par un autre ne remplace pas son brouillon', async (): Promise<void> => {
            store = create(plans_dto([plan()]), with_bob);
            const response: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
            save_plan.mockReturnValue(response);
            get_plans.mockReturnValue(of(plans_dto([bob_version])));
            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).toHaveBeenCalledTimes(1);

            realtime.plan_lock_changed$.next(bobLock(7));
            response.error(new HttpErrorResponse({ status: 423 }));
            await settle();

            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Bob a pris la main');
            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: false });
            expect(store.draft()?.basePa).toBe(22);
            expect(store.dirty()).toBe(false);
            expect(store.can_edit()).toBe(false);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).toHaveBeenCalledTimes(1);
        });

        it('une main reprise par le joueur dans un autre onglet est annoncée comme telle', async (): Promise<void> => {
            store = create();
            acceptSaves();
            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

            realtime.plan_lock_changed$.next({ planId: 7, holderUserId: ME, holderConnectionId: 'conn-other-tab' });

            expect(snackbar.warningSnackbar).toHaveBeenCalledTimes(1);
            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Tu as pris la main dans un autre onglet');
            expect(store.lock()).toEqual({ kind: 'other', userId: ME, sameUser: true });
        });

        it('une main perdue sur une proposition supprimée entre-temps annonce la suppression', async (): Promise<void> => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]), with_bob);
            save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 423 })));
            get_plans.mockReturnValue(of(plans_dto([plan({ id: 8, name: 'Plan B', isEffective: false })])));
            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            await settle();

            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Cette proposition a été supprimée');
            expect(store.selected_plan()?.id).toBe(8);
            expect(store.conflict()).toBeNull();
        });

        it('une main reprise avant l\'envoi abandonne la modification avec la bannière de conflit', async (): Promise<void> => {
            store = create(plans_dto([plan()]), with_bob);
            get_plans.mockReturnValue(of(plans_dto([bob_version])));
            edit();
            await settle();

            realtime.plan_lock_changed$.next(bobLock(7));
            await settle();

            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Bob a pris la main');
            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: false });
            expect(store.draft()?.basePa).toBe(22);
            expect(store.dirty()).toBe(false);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).not.toHaveBeenCalled();
        });

        it('une saisie encore en attente au moment de la reprise de main passe par la bannière au lieu de disparaître', async (): Promise<void> => {
            store = create(plans_dto([plan()]), with_bob);
            acceptSaves();
            get_plans.mockReturnValue(of(plans_dto([bob_version])));
            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(store.dirty()).toBe(false);
            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 30;
            });

            realtime.plan_lock_changed$.next(bobLock(7));
            await settle();

            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: false });
            expect(store.draft()?.basePa).toBe(22);
            expect(save_plan).toHaveBeenCalledTimes(1);
        });

        it('après un 409, n\'enregistre plus tant que la bannière n\'est pas fermée, puis reprend', async (): Promise<void> => {
            store = create();
            save_plan.mockReturnValueOnce(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })))
                .mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 6, content: request.content })));
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob' })])));
            edit(25);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });

            edit(26);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(store.save_state()).toBe('error');
            expect(await store.leave()).toBe(false);
            expect(save_plan).toHaveBeenCalledTimes(1);

            store.dismissConflict();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(save_plan).toHaveBeenCalledTimes(2);
            expect(save_plan.mock.calls[1][0].version).toBe(5);
            expect(save_plan.mock.calls[1][0].content.basePa).toBe(26);
            expect(store.save_state()).toBe('saved');
        });

        it('une bannière de conflit sur une proposition ne bloque pas l\'enregistrement d\'une autre après changement', async (): Promise<void> => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]));
            save_plan.mockReturnValueOnce(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })))
                .mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> =>
                    of(plan({ id: request.id ?? 0, name: request.name, isEffective: false, version: 6, content: request.content })));
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob' }), plan({ id: 8, name: 'Plan B', isEffective: false })])));
            edit(25);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });

            store.selectPlan(8);
            await settle();
            expect(store.conflict()).toBeNull();
            edit(30);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

            expect(save_plan.mock.calls[save_plan.mock.calls.length - 1][0].id).toBe(8);
            expect(store.save_state()).toBe('saved');
        });

        it('une bannière de copie abandonnée (main perdue) ne bloque pas les enregistrements suivants', async (): Promise<void> => {
            store = create(plans_dto([plan()]), with_bob);
            get_plans.mockReturnValue(of(plans_dto([bob_version])));
            edit();
            await settle();
            realtime.plan_lock_changed$.next(bobLock(7));
            await settle();
            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: false });

            store.takeLock();
            await settle();
            acceptSaves();
            edit(30);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(save_plan.mock.calls[0][0].content.basePa).toBe(30);
            expect(store.save_state()).toBe('saved');
        });

        it('une main perdue dont le rechargement finit après un changement de proposition ne met pas la bannière sur la nouvelle', async (): Promise<void> => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'Plan B', isEffective: false })]), with_bob);
            const reload: Subject<BuildingPlansDTO> = new Subject<BuildingPlansDTO>();
            save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 423 })));
            get_plans.mockReturnValue(reload);
            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

            store.selectPlan(8);
            reload.next(plans_dto([bob_version, plan({ id: 8, name: 'Plan B', isEffective: false })]));
            reload.complete();
            await settle();

            expect(store.selected_plan()?.id).toBe(8);
            expect(store.conflict()).toBeNull();
            expect(store.draft()).toEqual(plan({ id: 8 }).content);
        });

        it('un 423 pendant que le hub ne répond pas libère l\'écriture et affiche la bannière sans attendre le hub', async (): Promise<void> => {
            store = create();
            realtime.getPlanLocks.mockReturnValue(new Promise<PlanLockDTO[]>((): void => undefined));
            save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 423 })));
            get_plans.mockReturnValue(of(plans_dto([{ ...bob_version, authorName: 'A' }])));
            edit();
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            await settle();

            expect(store.conflict()).toEqual({ plan_id: 7, author: null, kept: false });
            expect(store.draft()?.basePa).toBe(22);
            expect(store.saving()).toBe(false);
            let left: boolean | null = null;
            void store.leave().then((saved: boolean): void => {
                left = saved;
            });
            await settle();
            expect(left).toBe(true);
        });

        it('une seule écriture à la fois : enregistrement automatique et sortie pendant un envoi long ne repartent qu\'une fois', async (): Promise<void> => {
            store = create();
            const first: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
            const second: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
            save_plan.mockReturnValueOnce(first).mockReturnValueOnce(second)
                .mockImplementation((request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> => of(plan({ version: 9, content: request.content })));
            edit(25);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            edit(26);
            await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
            const left: Promise<boolean> = store.leave();

            first.next(plan({ version: 4, content: { ...emptyPlanContent(), basePa: 25 } }));
            first.complete();
            await settle();
            second.next(plan({ version: 5, content: { ...emptyPlanContent(), basePa: 26 } }));
            second.complete();

            expect(await left).toBe(true);
            expect(save_plan).toHaveBeenCalledTimes(2);
            expect(save_plan.mock.calls[1][0].version).toBe(4);
            expect(store.dirty()).toBe(false);
        });

        it('leave enregistre ce qui attend, libère la main et renvoie faux sans la libérer si l\'enregistrement échoue', async (): Promise<void> => {
            store = create();
            acceptSaves();
            store.deferEdit('base', (content: BuildingPlanContentDTO): void => {
                content.basePa = 25;
            });

            expect(await store.leave()).toBe(true);
            expect(save_plan.mock.calls[0][0].content.basePa).toBe(25);
            expect(realtime.releasePlanLock).toHaveBeenCalledWith(7);
            expect(realtime.releasePlanLock.mock.invocationCallOrder[0]).toBeGreaterThan(save_plan.mock.invocationCallOrder[0]);

            save_plan.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 500 })));
            edit(26);
            expect(await store.leave()).toBe(false);
            await settle();
            expect(store.save_state()).toBe('error');
            expect(realtime.releasePlanLock).toHaveBeenCalledTimes(1);
        });

        it('leave sans main ni modification ne libère rien', async (): Promise<void> => {
            store = create();

            expect(await store.leave()).toBe(true);
            expect(realtime.releasePlanLock).not.toHaveBeenCalled();
        });

        it('relit le citoyen signalé par TaskChecksChanged', (): void => {
            store = create();
            const before: Citizen[] = store.citizens_full();
            get_citizen.mockReturnValue(of(Object.assign(new Citizen(), { id: ME, name: 'A2', is_dead: false })));

            realtime.task_checks_changed$.next(ME);

            expect(get_citizen).toHaveBeenCalledWith(ME);
            expect(store.citizens_full()).not.toBe(before);
            expect(store.citizens_full()[0].name).toBe('A2');
        });

        it('un échec de relecture (propositions après reconnexion, citoyen signalé) ne laisse pas d\'erreur non gérée', async (): Promise<void> => {
            expectWarnings();
            store = create();
            get_plans.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 500 })));
            get_citizen.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 500 })));

            realtime.reconnected$.next();
            realtime.task_checks_changed$.next(ME);
            await vi.advanceTimersByTimeAsync(10);

            expect(store.selected_plan()?.id).toBe(7);
        });

        it('affiche le détenteur déjà en place à l\'ouverture', async (): Promise<void> => {
            realtime.getPlanLocks.mockResolvedValue([bobLock(7)]);
            store = create(plans_dto([plan()]), with_bob);
            await settle();

            expect(store.lock()).toEqual({ kind: 'other', userId: 2, sameUser: false });
            expect(store.can_edit()).toBe(false);
        });

        it('à l\'ouverture, remet la connexion du hub sur la ville courante avant de relire les mains', async (): Promise<void> => {
            let reopened: () => void = (): void => undefined;
            realtime.ensureTown.mockReturnValue(new Promise<void>((resolve: () => void): void => {
                reopened = resolve;
            }));
            store = create();
            await settle();
            expect(realtime.ensureTown).toHaveBeenCalledTimes(1);
            expect(realtime.getPlanLocks).not.toHaveBeenCalled();

            reopened();
            await settle();

            expect(realtime.getPlanLocks).toHaveBeenCalledTimes(1);
        });

        it('distingue sa propre main tenue dans un autre onglet', async (): Promise<void> => {
            realtime.getPlanLocks.mockResolvedValue([{ planId: 7, holderUserId: ME, holderConnectionId: 'conn-other-tab' }]);
            store = create();
            await settle();

            expect(store.lock()).toEqual({ kind: 'other', userId: ME, sameUser: true });
        });

        it('ignore des mains illisibles (lecture refusée par le hub)', async (): Promise<void> => {
            const warnings: MockInstance<typeof console.warn> = expectWarnings();
            realtime.getPlanLocks.mockRejectedValue(new Error('forbidden'));
            store = create();
            await settle();

            expect(store.lock()).toEqual({ kind: 'free' });
            expect(store.can_edit()).toBe(true);
            expect(warnings).toHaveBeenCalledWith('GetPlanLocks', expect.any(Error));
        });

        it('takeLock reprend la main tenue par un autre', async (): Promise<void> => {
            realtime.getPlanLocks.mockResolvedValue([bobLock(7)]);
            store = create(plans_dto([plan()]), with_bob);
            await settle();

            store.takeLock();
            await settle();

            expect(realtime.takePlanLock).toHaveBeenCalledWith(7);
            expect(store.lock()).toEqual({ kind: 'mine' });
            expect(store.can_edit()).toBe(true);
        });

        it('deletePlan n\'envoie pas la suppression si la main est refusée', async (): Promise<void> => {
            realtime.acquirePlanLock.mockResolvedValue(bobLock(7));
            delete_plan.mockReturnValue(of(undefined));
            store = create(plans_dto([plan()]), with_bob);

            store.deletePlan();
            await settle();

            expect(realtime.acquirePlanLock).toHaveBeenCalledWith(7);
            expect(delete_plan).not.toHaveBeenCalled();
            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Bob modifie déjà cette proposition');
        });

        it('la proposition effective reste modifiable sous la main d\'un autre et suit les événements', async (): Promise<void> => {
            realtime.getPlanLocks.mockResolvedValue([bobLock(7)]);
            store = create(plans_dto([plan(), plan({ id: 9, name: 'Plan B', isEffective: false })]), with_bob);
            await settle();
            set_effective.mockReturnValue(of(plan()));

            store.setEffective();
            expect(set_effective).toHaveBeenCalledWith(7, 'conn-me');

            realtime.plan_effective_changed$.next(plan({ id: 9, name: 'Plan B', isEffective: true }));
            expect(store.plans_of_day().find((candidate: BuildingPlanDTO): boolean => candidate.id === 9)?.isEffective).toBe(true);
            expect(store.plans_of_day().find((candidate: BuildingPlanDTO): boolean => candidate.id === 7)?.isEffective).toBe(false);
        });

        it('applique les réglages reçus, sans toucher aux droits ni aux propositions', (): void => {
            store = create();
            save_settings.mockReturnValue(of(plans_dto([plan()])));

            realtime.settings_saved$.next({ ...plans_dto([], false), itemValues: { '5': 7 }, settingsVersion: 9 });

            expect(store.item_values().get(5)).toBe(7);
            expect(store.can_edit()).toBe(true);
            expect(store.plans_of_day().length).toBe(1);
            store.saveItemValues({ '5': 8 });
            expect(save_settings).toHaveBeenCalledWith({ itemValues: { '5': 8 }, version: 9 }, 'conn-me');
        });

        it('saveItemValues envoie la version de base donnée (modifications faites avant un réglage reçu) plutôt que la version courante', (): void => {
            store = create();
            save_settings.mockReturnValue(of(plans_dto([plan()])));
            expect(store.settings_version()).toBe(4);

            realtime.settings_saved$.next({ ...plans_dto([], false), itemValues: { '5': 7 }, settingsVersion: 9 });
            expect(store.settings_version()).toBe(9);
            store.saveItemValues({ '5': 8 }, 4);

            expect(save_settings).toHaveBeenCalledWith({ itemValues: { '5': 8 }, version: 4 }, 'conn-me');
        });

        it('ignore les événements du hub pour une ville observée (le hub suit la ville du jeton)', (): void => {
            store = create();
            const context: TownContextService = TestBed.inject(TownContextService);
            context.setObservedTown(Object.assign(new TownDetails(), { town_id: 99, day: TODAY }));

            realtime.plan_deleted$.next(7);
            context.clear();

            expect(store.selected_plan()?.id).toBe(7);
        });
    });
});
