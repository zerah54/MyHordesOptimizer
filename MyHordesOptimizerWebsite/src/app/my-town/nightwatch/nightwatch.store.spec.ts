import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, Subject, throwError } from 'rxjs';
import type { Mock, MockInstance } from 'vitest';

import { PlanLockDTO } from '../../_abstract_model/realtime-services/realtime-building-plans.service';
import { RealtimeNightwatchPlansService } from '../../_abstract_model/realtime-services/realtime-nightwatch-plans.service';
import { NightwatchPlanService } from '../../_abstract_model/services/nightwatch-plan.service';
import { Me } from '../../_abstract_model/types/me.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { setObservedTown, setTown, setUser } from '../../_core/utilities/localstorage.util';
import { NightwatchAttackService } from './nightwatch-attack.service';
import { NIGHTWATCH_AUTOSAVE_DELAY_MS, NightwatchStore } from './nightwatch.store';
import {
    emptyNightwatchContent,
    NightwatchCitizenStateDTO,
    NightwatchPlanDTO,
    NightwatchPlanRequestDTO,
    NightwatchPlansDTO,
    NightwatchReferentialDTO,
    NightwatchStateDTO
} from './nightwatch.types';

const TODAY: number = 10;
/** Joueur connecté. */
const ME: number = 1;

/** Doublure du hub de la page : flux à déclencher à la main, appels espionnés. */
interface FakeRealtime {
    plan_saved$: Subject<NightwatchPlanDTO>;
    plan_deleted$: Subject<number>;
    plan_effective_changed$: Subject<NightwatchPlanDTO>;
    plan_lock_changed$: Subject<PlanLockDTO>;
    reconnected$: Subject<void>;
    connectionId: Mock<() => string | null>;
    acquirePlanLock: Mock<(plan_id: number) => Promise<PlanLockDTO>>;
    takePlanLock: Mock<(plan_id: number) => Promise<PlanLockDTO>>;
    releasePlanLock: Mock<(plan_id: number) => Promise<void>>;
    getPlanLocks: Mock<() => Promise<PlanLockDTO[]>>;
    ensureTown: Mock<() => Promise<void>>;
}

function mineLock(plan_id: number): PlanLockDTO {
    return { planId: plan_id, holderUserId: ME, holderConnectionId: 'conn-me' };
}

function bobLock(plan_id: number): PlanLockDTO {
    return { planId: plan_id, holderUserId: 2, holderConnectionId: 'conn-bob' };
}

/** Hub qui accorde toujours la main à la connexion `conn-me`. */
function fakeRealtime(): FakeRealtime {
    return {
        plan_saved$: new Subject<NightwatchPlanDTO>(),
        plan_deleted$: new Subject<number>(),
        plan_effective_changed$: new Subject<NightwatchPlanDTO>(),
        plan_lock_changed$: new Subject<PlanLockDTO>(),
        reconnected$: new Subject<void>(),
        connectionId: vi.fn((): string | null => 'conn-me'),
        acquirePlanLock: vi.fn((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id))),
        takePlanLock: vi.fn((plan_id: number): Promise<PlanLockDTO> => Promise.resolve(mineLock(plan_id))),
        releasePlanLock: vi.fn((): Promise<void> => Promise.resolve()),
        getPlanLocks: vi.fn((): Promise<PlanLockDTO[]> => Promise.resolve([])),
        ensureTown: vi.fn((): Promise<void> => Promise.resolve())
    };
}

/** Laisse aboutir les promesses en attente (prise de main, enregistrement). */
async function settle(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
}

function plan(overrides: Partial<NightwatchPlanDTO> = {}): NightwatchPlanDTO {
    return {
        id: 7, day: TODAY, name: 'Plan A', isEffective: true, version: 3, authorId: 9, authorName: 'Zerah',
        content: { ...emptyNightwatchContent(), watchers: [{ userId: 1, statuses: [], items: { 5: 1 }, pastWatches: null, hasDiscourse: false }] },
        lastUpdateInfo: null, ...overrides
    };
}

function plans_dto(plans: NightwatchPlanDTO[], can_edit: boolean = true): NightwatchPlansDTO {
    return { access: { isCitizen: true, canEdit: can_edit }, plans };
}

function citizen(user_id: number, name: string, overrides: Partial<NightwatchCitizenStateDTO> = {}): NightwatchCitizenStateDTO {
    return {
        userId: user_id, name, isShunned: false, isGhoul: false, isDrugged: false, isDrunk: false, isThirsty: false, isImmune: false,
        bag: {}, bagBroken: {}, chest: {}, chestBroken: {}, ...overrides
    };
}

function state(overrides: Partial<NightwatchStateDTO> = {}): NightwatchStateDTO {
    return {
        citizens: [citizen(1, 'A', { bag: { 5: 1 } }), citizen(2, 'Bob'), citizen(3, 'C')],
        bank: { 5: 2 }, bankBroken: {}, desert: {}, desertBroken: {},
        roundPathLevel: 0, hasGuardRoom: false, hasSprinkler: false, builtBuildingUids: ['small_armor_#00'],
        townIsPanda: false, pastWatches: { 1: 4 }, ...overrides
    };
}

function referential(): NightwatchReferentialDTO {
    return {
        baseRisk: 0.08, fatigue: [0, 0.01, 0.04, 0.09, 0.2], fatiguePro: [0], statuses: {},
        items: { 5: { defense: 5, usage: 'single', repairPa: 0, repairPaSource: '', isEssential: false, batteries: 0, water: 0, watchImpact: 0, cumulative: false, source: 'game' } },
        watcherCapByRoundPathLevel: { 0: 2 }, roundPathLevel3Bonus: 0.01, guardRoomBonus: 0.05, sprinklerMalus: 0.04, bathBonus: 0.01,
        discourseDefense: 15, itemDefenseRequiresBuildingUid: 'small_armor_#00', defenseBonuses: []
    };
}

function http_error(status: number): Observable<never> {
    return throwError((): HttpErrorResponse => new HttpErrorResponse({ status }));
}

describe('NightwatchStore', (): void => {
    const get_plans: Mock<(map_id?: number) => Observable<NightwatchPlansDTO>> = vi.fn();
    const get_referential: Mock<() => Observable<NightwatchReferentialDTO>> = vi.fn();
    const get_state: Mock<(day: number, map_id?: number) => Observable<NightwatchStateDTO>> = vi.fn();
    const save_plan: Mock<(request: NightwatchPlanRequestDTO, connection_id: string | null, map_id?: number) => Observable<NightwatchPlanDTO>> = vi.fn();
    const delete_plan: Mock<(id: number, connection_id: string | null, map_id?: number) => Observable<void>> = vi.fn();
    const set_effective: Mock<(id: number, connection_id: string | null, map_id?: number) => Observable<NightwatchPlanDTO>> = vi.fn();
    let realtime: FakeRealtime;
    const attack_of_day: Mock<(day: number) => Observable<number | null>> = vi.fn();
    let snackbar: { warningSnackbar: Mock<(message: string) => void>; errorSnackbar: Mock<(message: string) => void> };
    let store: NightwatchStore;

    function create(dto: NightwatchPlansDTO = plans_dto([plan()])): NightwatchStore {
        get_plans.mockReturnValue(of(dto));
        TestBed.configureTestingModule({
            providers: [
                NightwatchStore,
                { provide: RealtimeNightwatchPlansService, useValue: realtime },
                { provide: SnackbarService, useValue: snackbar },
                { provide: NightwatchAttackService, useValue: { attackOfDay: attack_of_day } },
                { provide: NightwatchPlanService, useValue: { getPlans: get_plans, getReferential: get_referential, getState: get_state, savePlan: save_plan, deletePlan: delete_plan, setEffective: set_effective } }
            ]
        });
        const created: NightwatchStore = TestBed.inject(NightwatchStore);
        created.load();
        return created;
    }

    beforeEach((): void => {
        vi.useFakeTimers();
        vi.resetAllMocks();
        TestBed.resetTestingModule();
        setTown(Object.assign(new TownDetails(), { town_id: 42, day: TODAY, town_type: 'RNE' }));
        setUser(Object.assign(new Me(), { id: ME }));
        get_referential.mockReturnValue(of(referential()));
        get_state.mockImplementation((): Observable<NightwatchStateDTO> => of(state()));
        // Écritures sans réponse par défaut : la sortie du store (destruction du module) peut encore enregistrer.
        save_plan.mockReturnValue(NEVER);
        realtime = fakeRealtime();
        snackbar = { warningSnackbar: vi.fn(), errorSnackbar: vi.fn() };
        attack_of_day.mockReturnValue(of(null));
    });

    afterEach((): void => {
        vi.useRealTimers();
        setObservedTown(null);
        setTown(null);
        setUser(null);
    });

    it('load : un échec de ensureTown est journalisé sans rejet non géré ni relecture des mains', async (): Promise<void> => {
        const warn: MockInstance = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
        realtime.ensureTown.mockRejectedValue(new Error('hub'));

        store = create();
        await settle();

        expect(warn).toHaveBeenCalledWith('EnsureTown', expect.any(Error));
        expect(realtime.getPlanLocks).not.toHaveBeenCalled();
        expect(store.loading()).toBe(false);
        warn.mockRestore();
    });

    it('load : sélectionne la proposition effective du jour et en fait une copie de travail', (): void => {
        store = create();

        expect(store.selected_day()).toBe(TODAY);
        expect(store.selected_plan()?.id).toBe(7);
        expect(store.draft()).toEqual(plan().content);
        expect(store.draft()).not.toBe(store.selected_plan()?.content);
        expect(store.dirty()).toBe(false);
        expect(store.days()).toContain(TODAY + 7);
    });

    describe('droit d\'écriture', (): void => {
        it('un jour passé est en lecture seule, aujourd\'hui et le futur sont modifiables', (): void => {
            store = create(plans_dto([plan(), plan({ id: 8, day: TODAY - 1 })]));
            expect(store.can_write()).toBe(true);

            store.selectDay(TODAY - 1);
            expect(store.selected_plan()?.id).toBe(8);
            expect(store.can_write()).toBe(false);
            expect(store.can_edit()).toBe(false);
            store.addWatcher(3);
            expect(store.dirty()).toBe(false);
            expect(realtime.acquirePlanLock).not.toHaveBeenCalled();

            store.selectDay(TODAY + 2);
            expect(store.can_write()).toBe(true);
        });

        it('un non-citoyen ne peut pas écrire', (): void => {
            store = create(plans_dto([plan()], false));
            expect(store.can_write()).toBe(false);
        });
    });

    describe('jour sans proposition', (): void => {
        it('propose la création, puis enregistre et sélectionne la nouvelle proposition', async (): Promise<void> => {
            store = create();
            store.selectDay(TODAY + 1);
            expect(store.selected_plan()).toBeNull();
            expect(store.can_create()).toBe(true);
            save_plan.mockReturnValue(of(plan({ id: 20, day: TODAY + 1, name: 'Nuit 11', version: 1, content: emptyNightwatchContent() })));

            store.createPlan('Nuit 11');
            await settle();

            expect(save_plan).toHaveBeenCalledWith({ day: TODAY + 1, name: 'Nuit 11', content: emptyNightwatchContent() }, 'conn-me', 42);
            expect(store.selected_plan()?.id).toBe(20);
            expect(store.can_create()).toBe(false);
        });

        it('la création est refusée sur un jour passé', (): void => {
            store = create();
            store.selectDay(TODAY - 1);
            expect(store.can_create()).toBe(false);
            store.createPlan('x');
            expect(save_plan).not.toHaveBeenCalled();
        });
    });

    describe('enregistrement automatique', (): void => {
        it('part après 400 ms avec la version lue, puis chaîne la version de la réponse', async (): Promise<void> => {
            store = create();
            save_plan.mockImplementation((request: NightwatchPlanRequestDTO): Observable<NightwatchPlanDTO> =>
                of(plan({ version: (request.version ?? 0) + 1, content: request.content })));

            store.setInstructions('a');
            expect(store.save_state()).toBe('pending');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS - 1);
            expect(save_plan).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);

            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(save_plan.mock.calls[0][0]).toMatchObject({ id: 7, version: 3, day: TODAY });
            expect(store.save_state()).toBe('saved');
            expect(store.dirty()).toBe(false);

            store.setInstructions('b');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);

            expect(save_plan.mock.calls[1][0]).toMatchObject({ id: 7, version: 4 });
        });

        it('une rafale de modifications ne produit qu\'un enregistrement', async (): Promise<void> => {
            store = create();
            store.setInstructions('a');
            await vi.advanceTimersByTimeAsync(200);
            store.setInstructions('ab');
            await vi.advanceTimersByTimeAsync(200);
            expect(save_plan).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(200);

            expect(save_plan).toHaveBeenCalledTimes(1);
            expect(save_plan.mock.calls[0][0].content.instructions).toBe('ab');
        });

        it('une seule écriture à la fois : une modification pendant l\'envoi attend la réponse et repart avec sa version', async (): Promise<void> => {
            store = create();
            const first: Subject<NightwatchPlanDTO> = new Subject<NightwatchPlanDTO>();
            save_plan.mockReturnValueOnce(first);
            store.setInstructions('a');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            store.setInstructions('b');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            expect(save_plan).toHaveBeenCalledTimes(1);

            save_plan.mockImplementation((request: NightwatchPlanRequestDTO): Observable<NightwatchPlanDTO> => of(plan({ version: (request.version ?? 0) + 1, content: request.content })));
            first.next(plan({ version: 4, content: { ...emptyNightwatchContent(), instructions: 'a' } }));
            first.complete();
            await settle();

            expect(save_plan).toHaveBeenCalledTimes(2);
            expect(save_plan.mock.calls[1][0]).toMatchObject({ version: 4 });
            expect(save_plan.mock.calls[1][0].content.instructions).toBe('b');
        });
    });

    describe('sortie vers une autre ville', (): void => {
        it('sortie : l\'enregistrement part sur la ville de la page, pas sur celle que le contexte désigne alors', async (): Promise<void> => {
            const PSEUDO_MAP_ID: number = 1_000_000_007;
            setObservedTown(Object.assign(new TownDetails(), { town_id: PSEUDO_MAP_ID, day: TODAY, town_type: 'RNE' }));
            store = create();
            const first: Subject<NightwatchPlanDTO> = new Subject<NightwatchPlanDTO>();
            save_plan.mockReturnValueOnce(first);
            store.setInstructions('a');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            store.setInstructions('b');

            // La page est détruite (écriture en cours), puis le contexte de pré-ville est effacé, avant la fin de l'écriture.
            TestBed.resetTestingModule();
            setObservedTown(null);
            save_plan.mockReturnValue(NEVER);
            first.next(plan({ version: 4, content: { ...emptyNightwatchContent(), instructions: 'a' } }));
            first.complete();
            await settle();

            expect(save_plan).toHaveBeenCalledTimes(2);
            expect(save_plan.mock.calls[1][2]).toBe(PSEUDO_MAP_ID);
        });

        it('sortie avec un 409 : la relecture des propositions vise la ville de la page', async (): Promise<void> => {
            const PSEUDO_MAP_ID: number = 1_000_000_007;
            setObservedTown(Object.assign(new TownDetails(), { town_id: PSEUDO_MAP_ID, day: TODAY, town_type: 'RNE' }));
            store = create();
            const first: Subject<NightwatchPlanDTO> = new Subject<NightwatchPlanDTO>();
            save_plan.mockReturnValueOnce(first);
            store.setInstructions('a');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            get_plans.mockClear();
            get_plans.mockReturnValue(NEVER);

            TestBed.resetTestingModule();
            setObservedTown(null);
            first.error(new HttpErrorResponse({ status: 409 }));
            await settle();

            expect(get_plans).toHaveBeenCalledTimes(1);
            expect(get_plans).toHaveBeenCalledWith(PSEUDO_MAP_ID);
        });

        it('suppression attendant une écriture : la requête part sur la ville de la page', async (): Promise<void> => {
            const PSEUDO_MAP_ID: number = 1_000_000_007;
            setObservedTown(Object.assign(new TownDetails(), { town_id: PSEUDO_MAP_ID, day: TODAY, town_type: 'RNE' }));
            store = create();
            const first: Subject<NightwatchPlanDTO> = new Subject<NightwatchPlanDTO>();
            save_plan.mockReturnValueOnce(first);
            delete_plan.mockReturnValue(NEVER);
            store.setInstructions('a');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            store.deletePlan();
            await settle();

            TestBed.resetTestingModule();
            setObservedTown(null);
            first.next(plan({ version: 4, content: { ...emptyNightwatchContent(), instructions: 'a' } }));
            first.complete();
            await settle();

            expect(delete_plan).toHaveBeenCalledTimes(1);
            expect(delete_plan).toHaveBeenCalledWith(7, 'conn-me', PSEUDO_MAP_ID);
        });

        it('sans ville connue à l\'ouverture, les appels restent sur la ville du contexte à l\'appel', (): void => {
            setTown(null);
            store = create();

            expect(get_plans).toHaveBeenCalledWith(undefined);
        });
    });

    describe('verrou', (): void => {
        it('prend la main à la première modification', async (): Promise<void> => {
            store = create();
            expect(store.lock()).toEqual({ kind: 'free' });

            store.setInstructions('a');
            store.setInstructions('b');
            await settle();

            expect(realtime.acquirePlanLock).toHaveBeenCalledTimes(1);
            expect(realtime.acquirePlanLock).toHaveBeenCalledWith(7);
            expect(store.lock()).toEqual({ kind: 'mine' });
        });

        it('main tenue par un autre (423 à la prise) : modification annulée, proposition rechargée, auteur prévenu', async (): Promise<void> => {
            realtime.acquirePlanLock.mockResolvedValue(bobLock(7));
            store = create();
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 4, content: { ...emptyNightwatchContent(), instructions: 'Bob' } })])));

            store.setInstructions('moi');
            await settle();

            expect(store.draft()?.instructions).toBe('Bob');
            expect(store.dirty()).toBe(false);
            expect(store.can_edit()).toBe(false);
            expect(store.lock()).toEqual({ kind: 'other', userId: 2, sameUser: false });
            expect(snackbar.warningSnackbar).toHaveBeenCalledWith('Bob modifie déjà cette proposition');
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            expect(save_plan).not.toHaveBeenCalled();
        });
    });

    describe('conflits', (): void => {
        it('409 (version périmée) : conflit signalé, copie de travail conservée, version rechargée', async (): Promise<void> => {
            store = create();
            store.setInstructions('moi');
            save_plan.mockReturnValue(http_error(409));
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob', content: { ...emptyNightwatchContent(), instructions: 'Bob' } })])));

            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);

            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });
            expect(store.selected_plan()?.version).toBe(5);
            expect(store.draft()?.instructions).toBe('moi');
            expect(store.dirty()).toBe(true);
            expect(store.save_state()).toBe('error');
        });

        it('409 : rien ne repart tant que la bannière n\'est pas fermée, puis la copie s\'enregistre sur la version rechargée', async (): Promise<void> => {
            store = create();
            store.setInstructions('moi');
            save_plan.mockReturnValue(http_error(409));
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob' })])));
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            save_plan.mockClear();
            save_plan.mockImplementation((request: NightwatchPlanRequestDTO): Observable<NightwatchPlanDTO> => of(plan({ version: 6, content: request.content })));

            store.save();
            await settle();
            expect(save_plan).not.toHaveBeenCalled();

            store.dismissConflict();
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);

            expect(save_plan.mock.calls[0][0]).toMatchObject({ version: 5 });
            expect(store.conflict()).toBeNull();
            expect(store.dirty()).toBe(false);
        });

        it('423 (main perdue) : conflit signalé avec le détenteur, rien n\'est perdu en silence, la proposition est rechargée', async (): Promise<void> => {
            store = create();
            store.setInstructions('moi');
            await settle();
            expect(store.lock()).toEqual({ kind: 'mine' });
            save_plan.mockReturnValue(http_error(423));
            realtime.getPlanLocks.mockResolvedValue([bobLock(7)]);
            get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, content: { ...emptyNightwatchContent(), instructions: 'Bob' } })])));

            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);

            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: false });
            expect(store.draft()?.instructions).toBe('Bob');
            expect(store.selected_plan()?.version).toBe(5);
            expect(store.dirty()).toBe(false);
        });

        it('plan_saved$ d\'un autre auteur sur un plan non modifié : remplace la copie de travail', (): void => {
            store = create();

            realtime.plan_saved$.next(plan({ version: 4, content: { ...emptyNightwatchContent(), instructions: 'Bob' } }));

            expect(store.draft()?.instructions).toBe('Bob');
            expect(store.selected_plan()?.version).toBe(4);
            expect(store.conflict()).toBeNull();
        });

        it('plan_saved$ sur un plan modifié localement : conflit, copie conservée, jamais écrasée', async (): Promise<void> => {
            store = create();
            store.setInstructions('moi');

            realtime.plan_saved$.next(plan({ version: 4, authorName: 'Bob', content: { ...emptyNightwatchContent(), instructions: 'Bob' } }));

            expect(store.conflict()).toEqual({ plan_id: 7, author: 'Bob', kept: true });
            expect(store.draft()?.instructions).toBe('moi');
            expect(store.dirty()).toBe(true);
            expect(store.selected_plan()?.version).toBe(4);
            await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);
            expect(save_plan).not.toHaveBeenCalled();
        });

        it('plan_saved$ d\'une autre proposition : mise à jour de la liste, copie de travail intacte', (): void => {
            store = create(plans_dto([plan(), plan({ id: 8, name: 'B' })]));
            store.setInstructions('moi');

            realtime.plan_saved$.next(plan({ id: 8, name: 'B2', version: 2 }));

            expect(store.plans().find((p: NightwatchPlanDTO): boolean => p.id === 8)?.name).toBe('B2');
            expect(store.conflict()).toBeNull();
            expect(store.draft()?.instructions).toBe('moi');
        });
    });

    describe('citoyens simulés de pré-ville', (): void => {
        function createInPreTown(count: number): NightwatchStore {
            get_plans.mockReturnValue(of(plans_dto([plan()])));
            get_state.mockImplementation((): Observable<NightwatchStateDTO> => of(state({ citizens: [] })));
            TestBed.configureTestingModule({
                providers: [
                    NightwatchStore,
                    { provide: RealtimeNightwatchPlansService, useValue: realtime },
                    { provide: SnackbarService, useValue: snackbar },
                    { provide: NightwatchAttackService, useValue: { attackOfDay: attack_of_day } },
                    { provide: NightwatchPlanService, useValue: { getPlans: get_plans, getReferential: get_referential, getState: get_state, savePlan: save_plan, deletePlan: delete_plan, setEffective: set_effective } }
                ]
            });
            const context: TownContextService = TestBed.inject(TownContextService);
            context.setPreTownEditable(true);
            context.setSimulatedCitizens(count);
            const created: NightwatchStore = TestBed.inject(NightwatchStore);
            created.load();
            return created;
        }

        afterEach((): void => TestBed.inject(TownContextService).clear());

        it('en pré-ville, N citoyens simulés au chargement et au changement de jour', async (): Promise<void> => {
            store = createInPreTown(5);

            expect(store.state()?.citizens.length).toBe(5);
            expect(store.citizenState(-2)).toBeDefined();

            store.selectDay(TODAY + 1);
            expect(store.state()?.citizens.length).toBe(5);
            await settle();
        });

        it('hors pré-ville, l\'état reçu est inchangé', (): void => {
            get_state.mockImplementation((): Observable<NightwatchStateDTO> => of(state({ citizens: [] })));
            store = create();

            expect(store.state()?.citizens).toEqual([]);
        });
    });

    describe('veilleurs', (): void => {
        it('past_watches null : valeur déduite de l\'état (plans effectifs antérieurs) ; explicite : prioritaire ; absente : 0', (): void => {
            store = create(plans_dto([plan({ content: { ...emptyNightwatchContent(), watchers: [
                { userId: 1, statuses: [], items: {}, pastWatches: null, hasDiscourse: false },
                { userId: 2, statuses: [], items: {}, pastWatches: 7, hasDiscourse: false },
                { userId: 3, statuses: [], items: {}, pastWatches: null, hasDiscourse: false }
            ] } })]));

            expect(store.watcher_rows().map((row: { past_watches: number }): number => row.past_watches)).toEqual([4, 7, 0]);
        });

        it('le Discours rassurant est unique : l\'activer pour un veilleur le retire à l\'autre', async (): Promise<void> => {
            store = create();
            store.addWatcher(2);
            store.setDiscourse(1, true);
            expect(store.draft()?.watchers.map((w: { hasDiscourse: boolean }): boolean => w.hasDiscourse)).toEqual([true, false]);

            store.setDiscourse(2, true);
            expect(store.draft()?.watchers.map((w: { hasDiscourse: boolean }): boolean => w.hasDiscourse)).toEqual([false, true]);

            store.setDiscourse(2, false);
            expect(store.draft()?.watchers.map((w: { hasDiscourse: boolean }): boolean => w.hasDiscourse)).toEqual([false, false]);
            await settle();
        });

        it('addWatcher sans doublon, removeWatcher, setItem (0 retire), toggleStatus, setManualStock', async (): Promise<void> => {
            store = create();

            store.addWatcher(2);
            store.addWatcher(2);
            store.setItem(2, 5, 3);
            store.setItem(1, 5, 0);
            store.toggleStatus(2, 'drugged');
            store.toggleStatus(2, 'dog');
            store.toggleStatus(2, 'dog');
            store.setManualStock(5, 4);
            store.setPastWatches(2, 2);
            store.setAttackOverride(900);

            expect(store.draft()?.watchers).toEqual([
                { userId: 1, statuses: [], items: {}, pastWatches: null, hasDiscourse: false },
                { userId: 2, statuses: ['drugged'], items: { 5: 3 }, pastWatches: 2, hasDiscourse: false, note: null }
            ]);
            expect(store.draft()?.manualStock).toEqual({ 5: 4 });
            expect(store.draft()?.attackOverride).toBe(900);

            store.removeWatcher(1);
            expect(store.draft()?.watchers.map((w: { userId: number }): number => w.userId)).toEqual([2]);
            await settle();
        });
    });

    describe('calculs', (): void => {
        it('over_cap : plus de veilleurs que le plafond du Chemin de ronde', async (): Promise<void> => {
            store = create();
            expect(store.over_cap()).toBe(false);
            store.addWatcher(2);
            expect(store.over_cap()).toBe(false);
            store.addWatcher(3);
            expect(store.over_cap()).toBe(true);
            expect(store.totals()?.cap).toBe(2);
            await settle();
        });

        it('watcher_rows : défense (10 + objets intacts), risque et palier du veilleur', (): void => {
            store = create();

            const row: { defense: number; risk: number; name: string } = store.watcher_rows()[0];
            expect(row.name).toBe('A');
            expect(row.defense).toBe(15);
            expect(row.risk).toBe(0.28);
        });

        it('stock_lines, gaps et totals : réel comparé au plan, marge contre l\'attaque imposée', async (): Promise<void> => {
            store = create();
            store.setItem(1, 5, 3);
            store.setAttackOverride(10);

            expect(store.stock_lines()).toEqual([expect.objectContaining({ item_id: 5, need: 3, in_bag: 1, in_bank: 2, remaining: 0 })]);
            expect(store.gaps()[0].missing_items).toEqual({ 5: 2 });
            expect(store.totals()).toMatchObject({ defense: 25, real_defense: 15, planned_margin: 15, real_margin: 5, watcher_count: 1 });
            await settle();
        });
    });

    describe('attaque estimée', (): void => {
        it('la surcharge du plan de veille est prioritaire sur l\'estimation', async (): Promise<void> => {
            attack_of_day.mockReturnValue(of(500));
            store = create();
            store.setItem(1, 5, 3);
            store.setAttackOverride(10);

            expect(store.totals()).toMatchObject({ planned_margin: 15, real_margin: 5 });
            await settle();
        });

        it('sans surcharge de veille : repli sur l\'attaque lue pour le jour (chantiers ou estimation)', (): void => {
            attack_of_day.mockReturnValue(of(20));
            store = create();
            store.setItem(1, 5, 3);

            expect(attack_of_day).toHaveBeenCalledWith(TODAY);
            expect(store.totals()).toMatchObject({ planned_margin: 5, real_margin: -5 });
        });

        it('aucune attaque connue : marges nulles', (): void => {
            store = create();

            expect(store.totals()?.planned_margin).toBeNull();
            expect(store.totals()?.real_margin).toBeNull();
        });

        it('changement de jour : l\'attaque du jour précédent n\'est pas reprise, celle du nouveau jour est lue', (): void => {
            attack_of_day.mockReturnValue(of(20));
            store = create();
            const next: Subject<number | null> = new Subject<number | null>();
            attack_of_day.mockReturnValue(next);

            expect(store.attack()).toBe(20);
            store.selectDay(TODAY + 1);
            expect(store.attack()).toBeNull();
            next.next(30);

            expect(attack_of_day).toHaveBeenLastCalledWith(TODAY + 1);
            expect(store.attack()).toBe(30);
        });
    });

    it('selectDay : échec de lecture de l\'état du jour -> erreur signalée, état du jour précédent non présenté', (): void => {
        store = create();
        get_state.mockReturnValue(http_error(500));

        store.selectDay(TODAY + 1);

        expect(snackbar.errorSnackbar).toHaveBeenCalledTimes(1);
        expect(store.state()).toBeNull();
    });

    it('toggleStatus : chien et chien avec steak ne se cumulent pas', async (): Promise<void> => {
        store = create();
        store.toggleStatus(1, 'dog');
        store.toggleStatus(1, 'dogSteak');
        expect(store.draft()?.watchers[0].statuses).toEqual(['dogSteak']);
        store.toggleStatus(1, 'dog');
        expect(store.draft()?.watchers[0].statuses).toEqual(['dog']);
        await settle();
    });

    it('goule : initialisée d\'après la page citoyens, modifiable ; revenir à l\'état réel retire la saisie du plan', async (): Promise<void> => {
        get_state.mockImplementation((): Observable<NightwatchStateDTO> => of(state({
            citizens: [citizen(1, 'A'), citizen(2, 'Bob', { isGhoul: true }), citizen(3, 'C')]
        })));
        store = create();
        store.addWatcher(2);
        await settle();
        const statuses = (user_id: number): string[] | undefined => store.draft()?.watchers.find((w: { userId: number }): boolean => w.userId === user_id)?.statuses;

        expect(store.isGhoul(1)).toBe(false);
        expect(store.isGhoul(2)).toBe(true);

        store.toggleStatus(1, 'ghoul');
        expect(statuses(1)).toEqual(['ghoul']);
        expect(store.isGhoul(1)).toBe(true);
        store.toggleStatus(1, 'ghoul');
        expect(statuses(1)).toEqual([]);

        store.toggleStatus(2, 'ghoul');
        expect(statuses(2)).toEqual(['notGhoul']);
        expect(store.isGhoul(2)).toBe(false);
        store.toggleStatus(2, 'ghoul');
        expect(statuses(2)).toEqual([]);
        expect(store.isGhoul(2)).toBe(true);
    });

    it('conflit : nomme le dernier éditeur, repli sur l\'auteur', async (): Promise<void> => {
        store = create();
        store.setInstructions('moi');
        save_plan.mockReturnValue(http_error(409));
        get_plans.mockReturnValue(of(plans_dto([plan({ version: 5, authorName: 'Bob', lastUpdateInfo: { userId: 4, userName: 'Carole', updateTime: '2026-11-13T10:00:00Z' } })])));

        await vi.advanceTimersByTimeAsync(NIGHTWATCH_AUTOSAVE_DELAY_MS);

        expect(store.conflict()?.author).toBe('Carole');
    });

    it('selectDay relit l\'état du jour', (): void => {
        store = create();
        get_state.mockClear();

        store.selectDay(TODAY + 1);

        expect(get_state).toHaveBeenCalledWith(TODAY + 1, 42);
    });
});
