import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE, Signal, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import moment from 'moment';
import { NEVER, Observable, of, Subject } from 'rxjs';
import type { Mock, MockInstance } from 'vitest';

import { EXPEDITIONS_EDITION_MODE_KEY } from '../../_abstract_model/const';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { RealtimeExpeditionsService } from '../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ApiService } from '../../_abstract_model/services/api.service';
import { BuiltBuildingsService } from '../../_abstract_model/services/built-buildings.service';
import { ExpeditionService } from '../../_abstract_model/services/expedition.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { ExpeditionDuplicateChoices, SpRequirementOperator } from '../../_abstract_model/types/_types';
import { Cell } from '../../_abstract_model/types/cell.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { CitizenExpeditionBag } from '../../_abstract_model/types/citizen-expedition-bag.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../_abstract_model/types/expedition-part.class';
import { Item } from '../../_abstract_model/types/item.class';
import { DEFAULT_MAP_ROUTE_COLOR, MapRoutePoint } from '../../_abstract_model/types/map-route.class';
import { Me } from '../../_abstract_model/types/me.class';
import { Town } from '../../_abstract_model/types/town.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../_core/services/town-context.service';
import { setTown } from '../../_core/utilities/localstorage.util';
import { ExpeditionDuplicateDialogComponent, ExpeditionDuplicateDialogData } from './expedition-duplicate-dialog/expedition-duplicate-dialog.component';
import { ApCheck } from './expedition-resources.util';
import { ExpeditionsComponent } from './expeditions.component';

interface RealtimeStub {
    updateExpeditionCitizen: Mock<(part: ExpeditionPart, citizen: CitizenExpedition) => Promise<void>>;
    duplicateExpedition: Mock<(expedition: Expedition, label: string | null, choices: ExpeditionDuplicateChoices) => Promise<void>>;
    joinPresence: Mock<() => Promise<void>>;
    leavePresence: Mock<() => Promise<void>>;
}

interface DestroyRefStub {
    destroyed: boolean;
    onDestroy: Mock<(callback: () => void) => () => void>;
}

/** Membres testés du composant, créé sans son constructeur. */
interface ComponentInternals {
    realtime_expeditions_service: RealtimeStub;
    destroy_ref: DestroyRefStub;
    can_contribute: Signal<boolean>;
    editable: WritableSignal<boolean>;
    declarePresence(): void;
    addNewMemberToPart(expedition_part: ExpeditionPart, citizen_to_copy?: CitizenExpedition): Promise<void>;
    addNewMemberToExpedition(expedition: Expedition, citizen_to_copy?: CitizenExpedition): void;
    dialog: { open: Mock };
    duplicateExpedition(expedition: Expedition): void;
    updateEditableForDay(day: number): void;
    expedition_service: { getExpeditions: Mock<(day: number) => Observable<Expedition[]>> };
    selected_day: WritableSignal<number>;
    changeDay(day: number): Promise<void>;
    isDirectionLocked(expedition_part: ExpeditionPart): boolean;
    me: Signal<Me | null>;
    all_citizens: WritableSignal<Citizen[]>;
    canJoin(place: CitizenExpedition, expedition_day: number): boolean;
    scouts_lair_built: Signal<boolean>;
    town_position: Signal<MapRoutePoint | null>;
    all_items: WritableSignal<Item[]>;
    bank_items: WritableSignal<Item[]>;
    count_available_ap: { transform: Mock<() => number> };
    apWarning(expedition: Expedition, part_index: number, citizen_index: number, expedition_day: number): ApCheck | null;
    apWarningLabel(check: ApCheck): string;
    spDisplay(place: CitizenExpedition, expedition_day: number): string;
    saveSpRequirement(expedition: Expedition, citizen_index: number, required_sp: number, operator: SpRequirementOperator): Promise<void>;
    saveRequirement(expedition: Expedition, citizen_index: number, requirement: Partial<CitizenExpedition>): Promise<void>;
    saveCitizen(expedition_part: ExpeditionPart, citizen: CitizenExpedition, expedition_part_index?: number, expedition?: Expedition, citizen_index?: number): Promise<void>;
    expeditions: WritableSignal<Expedition[]>;
    subscribeToRealtimeExpeditions(): void;
}

describe('ExpeditionsComponent', () => {
    let internals: ComponentInternals;
    let realtime_expeditions_service: RealtimeStub;

    function sentCitizen(): CitizenExpedition {
        const call: [ExpeditionPart, CitizenExpedition] | undefined = realtime_expeditions_service.updateExpeditionCitizen.mock.lastCall;
        expect(call).toBeDefined();
        return (<[ExpeditionPart, CitizenExpedition]>call)[1];
    }

    beforeEach(() => {
        internals = <ComponentInternals><unknown>Object.create(ExpeditionsComponent.prototype);
        realtime_expeditions_service = {
            updateExpeditionCitizen: vi.fn().mockReturnValue(Promise.resolve()),
            duplicateExpedition: vi.fn().mockReturnValue(Promise.resolve()),
            joinPresence: vi.fn().mockReturnValue(Promise.resolve()),
            leavePresence: vi.fn().mockReturnValue(Promise.resolve())
        };
        internals.realtime_expeditions_service = realtime_expeditions_service;
    });

    describe('declarePresence', () => {
        let destroy_ref: DestroyRefStub;

        beforeEach(() => {
            destroy_ref = { destroyed: false, onDestroy: vi.fn().mockReturnValue(() => undefined) };
            internals.destroy_ref = destroy_ref;
        });

        it('declares the presence once the page is open', () => {
            internals.declarePresence();

            expect(realtime_expeditions_service.joinPresence).toHaveBeenCalledTimes(1);
            expect(realtime_expeditions_service.leavePresence).not.toHaveBeenCalled();
        });

        it('withdraws the presence when the page is destroyed', () => {
            internals.declarePresence();

            const on_destroy: () => void = destroy_ref.onDestroy.mock.calls[0][0];
            on_destroy();

            expect(realtime_expeditions_service.leavePresence).toHaveBeenCalledTimes(1);
        });

        it('declares nothing when the page was destroyed before reaching it', () => {
            destroy_ref.destroyed = true;

            internals.declarePresence();

            expect(realtime_expeditions_service.joinPresence).not.toHaveBeenCalled();
            expect(destroy_ref.onDestroy).not.toHaveBeenCalled();
        });

        it('still registers the withdrawal when the hub refuses the presence', async () => {
            realtime_expeditions_service.joinPresence.mockRejectedValueOnce(new Error('Forbidden'));
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            internals.declarePresence();
            await Promise.resolve();

            expect(destroy_ref.onDestroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('addNewMemberToPart', () => {
        it('sends a fresh citizen (no id) instead of updating the copied one', async () => {
            const part: ExpeditionPart = new ExpeditionPart();
            const existing_citizen: CitizenExpedition = new CitizenExpedition();
            existing_citizen.id = 123;
            existing_citizen.preinscrit = true;

            await internals.addNewMemberToPart(part, existing_citizen);

            expect(sentCitizen().id).toBeUndefined();
            expect(sentCitizen().preinscrit).toBe(true);
        });
    });

    describe('updateEditableForDay', () => {
        beforeEach(() => {
            const town: TownDetails = new TownDetails();
            town.town_id = 42;
            town.day = 5;
            setTown(town);
            internals.editable = signal(true);
        });

        afterEach(() => {
            setTown(null);
        });

        it('lets a citizen edit the current day, also on a former town', () => {
            internals.can_contribute = signal(true);

            internals.updateEditableForDay(5);

            expect(internals.editable()).toBe(true);
        });

        it('keeps a past day locked', () => {
            internals.can_contribute = signal(true);

            internals.updateEditableForDay(4);

            expect(internals.editable()).toBe(false);
        });

        it('keeps the town of someone else read only', () => {
            internals.can_contribute = signal(false);

            internals.updateEditableForDay(5);

            expect(internals.editable()).toBe(false);
        });
    });

    describe('changeDay', () => {
        beforeEach(() => {
            const town: TownDetails = new TownDetails();
            town.day = 5;
            setTown(town);
            internals.can_contribute = signal(true);
            internals.editable = signal(true);
            internals.expeditions = signal([]);
            internals.selected_day = signal(5);
        });

        afterEach(() => {
            setTown(null);
        });

        it('shows the expeditions of the requested day and locks a past day', async () => {
            const past_day: Expedition = Object.assign(new Expedition(), { id: 4 });
            internals.expedition_service = { getExpeditions: vi.fn().mockReturnValue(of([past_day])) };

            await internals.changeDay(4);

            expect(internals.expedition_service.getExpeditions).toHaveBeenCalledWith(4);
            expect(internals.selected_day()).toBe(4);
            expect(internals.expeditions()).toEqual([past_day]);
            expect(internals.editable()).toBe(false);
        });

        it('ignores the late answer of a day left in the meantime', async () => {
            const slow_day: Subject<Expedition[]> = new Subject<Expedition[]>();
            const last_day: Expedition = Object.assign(new Expedition(), { id: 6 });
            internals.expedition_service = {
                getExpeditions: vi.fn((day: number): Observable<Expedition[]> => day === 4 ? slow_day.asObservable() : of([last_day]))
            };

            const slow_change: Promise<void> = internals.changeDay(4);
            await internals.changeDay(6);
            slow_day.next([Object.assign(new Expedition(), { id: 4 })]);
            await slow_change;

            expect(internals.selected_day()).toBe(6);
            expect(internals.expeditions()).toEqual([last_day]);
            expect(internals.editable()).toBe(true);
        });
    });

    describe('isDirectionLocked', () => {
        it('locks the compass rose of a part linked to a route', () => {
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { map_route_id: 7 });

            expect(internals.isDirectionLocked(part)).toBe(true);
        });

        it('leaves the compass rose of a part without route editable', () => {
            expect(internals.isDirectionLocked(new ExpeditionPart())).toBe(false);
        });
    });

    describe('canJoin', () => {
        const ME_ID: number = 7;

        function citizenWith(extra: Partial<Citizen>): Citizen {
            return Object.assign(new Citizen(), { id: ME_ID, is_dead: false }, extra);
        }

        function placeWith(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), extra);
        }

        beforeEach(() => {
            const town: TownDetails = new TownDetails();
            town.day = 5;
            setTown(town);
            internals.me = signal(Object.assign(new Me(), { id: ME_ID }));
            internals.scouts_lair_built = signal(true);
        });

        afterEach(() => {
            setTown(null);
        });

        it('lets the connected citizen join a place without requirement', () => {
            internals.all_citizens = signal([citizenWith({})]);

            expect(internals.canJoin(placeWith({}), 5)).toBe(true);
        });

        it('refuses a citizen without shoes a place which requires them', () => {
            internals.all_citizens = signal([citizenWith({ shoes_equipped: false })]);

            expect(internals.canJoin(placeWith({ requires_shoes: true }), 5)).toBe(false);
        });

        it('lets a citizen with shoes join a place which requires them', () => {
            internals.all_citizens = signal([citizenWith({ shoes_equipped: true })]);

            expect(internals.canJoin(placeWith({ requires_shoes: true }), 5)).toBe(true);
        });

        it('refuses a citizen of another job a place pre-registered for a job', () => {
            internals.all_citizens = signal([citizenWith({ job: JobEnum.GUARDIAN })]);

            expect(internals.canJoin(placeWith({ preinscrit_job: JobEnum.SCOUT.key }), 5)).toBe(false);
        });

        it('counts the mapping SP of a future expedition', () => {
            internals.all_citizens = signal([citizenWith({})]);

            expect(internals.canJoin(placeWith({ required_sp: 2 }), 5)).toBe(false);
            expect(internals.canJoin(placeWith({ required_sp: 2 }), 6)).toBe(true);
        });

        it('does not count the mapping SP of a future expedition without the Scouts Lair', () => {
            internals.all_citizens = signal([citizenWith({})]);
            internals.scouts_lair_built = signal(false);

            expect(internals.canJoin(placeWith({ required_sp: 2 }), 6)).toBe(false);
        });

        it('refuses when the connected user is not among the citizens', () => {
            internals.all_citizens = signal([citizenWith({ id: 99 })]);

            expect(internals.canJoin(placeWith({}), 5)).toBe(false);
        });

        it('refuses when nobody is connected', () => {
            internals.me = signal(null);
            internals.all_citizens = signal([citizenWith({})]);

            expect(internals.canJoin(placeWith({}), 5)).toBe(false);
        });
    });

    describe('addNewMemberToExpedition', () => {
        it('sends a fresh citizen (no id) instead of updating the copied one', () => {
            const part: ExpeditionPart = new ExpeditionPart();
            const expedition: Expedition = Object.assign(new Expedition(), { parts: [part] });
            const existing_citizen: CitizenExpedition = new CitizenExpedition();
            existing_citizen.id = 123;

            internals.addNewMemberToExpedition(expedition, existing_citizen);

            expect(sentCitizen().id).toBeUndefined();
        });
    });

    describe('duplicateExpedition', () => {
        const CHOICES: ExpeditionDuplicateChoices = { keepRoute: false, keepGeneralOrders: true, keepRouteOrders: false };
        let open_dialog: Mock<(component: unknown, config: { data: ExpeditionDuplicateDialogData }) => unknown>;

        function closeDialogWith(result: ExpeditionDuplicateChoices | string | undefined): void {
            open_dialog = vi.fn().mockReturnValue({ afterClosed: (): Observable<unknown> => of(result) });
            internals.dialog = { open: open_dialog };
            internals.destroy_ref = { destroyed: false, onDestroy: vi.fn().mockReturnValue(() => undefined) };
        }

        it('names the copy after the expedition and sends the choices', () => {
            closeDialogWith(CHOICES);
            const expedition: Expedition = Object.assign(new Expedition(), { id: 1, label: 'Nord' });

            internals.duplicateExpedition(expedition);

            expect(realtime_expeditions_service.duplicateExpedition).toHaveBeenCalledWith(expedition, 'Nord (copie)', CHOICES);
        });

        it('leaves the copy of an unnamed expedition unnamed', () => {
            closeDialogWith(CHOICES);
            const expedition: Expedition = Object.assign(new Expedition(), { id: 1, label: '' });

            internals.duplicateExpedition(expedition);

            expect(realtime_expeditions_service.duplicateExpedition).toHaveBeenCalledWith(expedition, null, CHOICES);
        });

        it('copies nothing when the dialog is cancelled', () => {
            // Le bouton `mat-dialog-close` sans valeur ferme avec une chaîne vide, le fond de la boîte avec undefined.
            for (const cancelled of ['', undefined]) {
                closeDialogWith(cancelled);

                internals.duplicateExpedition(Object.assign(new Expedition(), { id: 1, label: 'Nord' }));
            }

            expect(realtime_expeditions_service.duplicateExpedition).not.toHaveBeenCalled();
        });

        it('asks about the route only when a part follows one', () => {
            closeDialogWith(undefined);
            const unlinked: ExpeditionPart = new ExpeditionPart();
            const linked: ExpeditionPart = Object.assign(new ExpeditionPart(), { map_route_id: 4 });

            internals.duplicateExpedition(Object.assign(new Expedition(), { id: 1, parts: [unlinked] }));
            internals.duplicateExpedition(Object.assign(new Expedition(), { id: 2, parts: [unlinked, linked] }));

            expect(open_dialog.mock.calls.map(([, config]): boolean => config.data.hasRoute)).toEqual([false, true]);
        });
    });

    describe('saveCitizen', () => {
        function placeWith(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), { orders: [] }, extra);
        }

        function partWith(place: CitizenExpedition): ExpeditionPart {
            return Object.assign(new ExpeditionPart(), { citizens: [place] });
        }

        function expeditionOf(...parts: ExpeditionPart[]): Expedition {
            return Object.assign(new Expedition(), { parts });
        }

        it('copies the citizen chosen in the first part onto the empty place of the same rank in each other part, each saved with its own object', async () => {
            const first_place: CitizenExpedition = placeWith({ id: 10, citizen_id: 7, preinscrit: true, preinscrit_job: 'scout' });
            const second_place: CitizenExpedition = placeWith({ id: 20 });
            const third_place: CitizenExpedition = placeWith({ id: 30 });
            const second_bag: CitizenExpeditionBag = second_place.bag;
            const second_orders: ExpeditionOrder[] = second_place.orders;
            const first_part: ExpeditionPart = partWith(first_place);
            const second_part: ExpeditionPart = partWith(second_place);
            const third_part: ExpeditionPart = partWith(third_place);

            await internals.saveCitizen(first_part, first_place, 0, expeditionOf(first_part, second_part, third_part), 0);

            const calls: [ExpeditionPart, CitizenExpedition][] = realtime_expeditions_service.updateExpeditionCitizen.mock.calls;
            expect(calls.length).toBe(3);
            expect(calls[0]).toEqual([first_part, first_place]);
            expect(calls[1][0]).toBe(second_part);
            expect(calls[1][1]).toBe(second_place);
            expect(calls[2][0]).toBe(third_part);
            expect(calls[2][1]).toBe(third_place);
            expect(second_place.id).toBe(20);
            expect(third_place.id).toBe(30);
            for (const place of [second_place, third_place]) {
                expect(place.citizen_id).toBe(7);
                expect(place.preinscrit).toBe(true);
                expect(place.preinscrit_job).toBe('scout');
            }
            expect(second_place.bag).toBe(second_bag);
            expect(second_place.orders).toBe(second_orders);
        });

        it('leaves an occupied place of another part untouched', async () => {
            const first_place: CitizenExpedition = placeWith({ id: 10, citizen_id: 7 });
            const second_place: CitizenExpedition = placeWith({ id: 20, citizen_id: 8 });
            const first_part: ExpeditionPart = partWith(first_place);

            await internals.saveCitizen(first_part, first_place, 0, expeditionOf(first_part, partWith(second_place)), 0);

            expect(realtime_expeditions_service.updateExpeditionCitizen).toHaveBeenCalledTimes(1);
            expect(second_place.citizen_id).toBe(8);
        });

        it('saves only the place itself in a single-part expedition', async () => {
            const place: CitizenExpedition = placeWith({ id: 10, citizen_id: 7 });
            const part: ExpeditionPart = partWith(place);

            await internals.saveCitizen(part, place, 0, expeditionOf(part), 0);

            expect(realtime_expeditions_service.updateExpeditionCitizen.mock.calls).toEqual([[part, place]]);
        });
    });

    describe('suppression d\'une expédition', () => {
        function waitingFor(expedition_id: number): ExpeditionOrder {
            return Object.assign(new ExpeditionOrder(), { kind: 'wait', target_expedition_id: expedition_id });
        }

        it('stops every order of the other expeditions from waiting for it, as the database does', () => {
            const deleted: Subject<number> = new Subject<number>();
            const streams: Record<string, Observable<unknown>> = new Proxy<Record<string, Observable<unknown>>>({}, {
                get: (_target: Record<string, Observable<unknown>>, key: string | symbol): Observable<unknown> => key === 'expedition_deleted$' ? deleted : NEVER
            });
            internals.realtime_expeditions_service = <RealtimeStub><unknown>streams;
            internals.destroy_ref = { destroyed: false, onDestroy: vi.fn().mockReturnValue(() => undefined) };
            const part_order: ExpeditionOrder = waitingFor(1);
            const first_place_order: ExpeditionOrder = waitingFor(1);
            const second_place_order: ExpeditionOrder = waitingFor(1);
            const other_target_order: ExpeditionOrder = waitingFor(3);
            const first_part: ExpeditionPart = Object.assign(new ExpeditionPart(), {
                id: 20, orders: [part_order, other_target_order], citizens: [Object.assign(new CitizenExpedition(), { orders: [first_place_order] })]
            });
            const second_part: ExpeditionPart = Object.assign(new ExpeditionPart(), {
                id: 21, orders: [], citizens: [Object.assign(new CitizenExpedition(), { orders: [second_place_order] })]
            });
            internals.expeditions = signal([
                Object.assign(new Expedition(), { id: 1, parts: [] }),
                Object.assign(new Expedition(), { id: 2, parts: [first_part, second_part] })
            ]);

            internals.subscribeToRealtimeExpeditions();
            deleted.next(1);

            expect(internals.expeditions().map((expedition: Expedition): number | undefined => expedition.id)).toEqual([2]);
            expect(part_order.target_expedition_id).toBeNull();
            expect(first_place_order.target_expedition_id).toBeNull();
            expect(second_place_order.target_expedition_id).toBeNull();
            expect(other_target_order.target_expedition_id).toBe(3);
            expect(internals.expeditions()[0].parts[0]).not.toBe(first_part);
            expect(internals.expeditions()[0].parts[1]).not.toBe(second_part);
        });
    });

    describe('PE et avertissement de PA', () => {
        const CITIZEN_ID: number = 7;

        /** Tracé en ligne droite depuis la ville (10, 10) jusqu'à `km` cases au sud. */
        function routeOut(km: number): ExpeditionPartRoute {
            const cells: MapRoutePoint[] = Array.from({ length: km + 1 }, (_: unknown, index: number): MapRoutePoint => ({ x: 10, y: 10 + index }));
            return { id: 1, label: '', color: DEFAULT_MAP_ROUTE_COLOR, cells, length: km, version: 1 };
        }

        function placeWith(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), extra);
        }

        function partWith(route: ExpeditionPartRoute | null, place: CitizenExpedition, orders: ExpeditionOrder[] = []): ExpeditionPart {
            return Object.assign(new ExpeditionPart(), { map_route: route, citizens: [place], orders });
        }

        function partWithPlaces(route: ExpeditionPartRoute | null, ...places: CitizenExpedition[]): ExpeditionPart {
            return Object.assign(new ExpeditionPart(), { map_route: route, citizens: places, orders: [] });
        }

        function expeditionOf(...parts: ExpeditionPart[]): Expedition {
            return Object.assign(new Expedition(), { parts });
        }

        beforeEach(() => {
            const town: TownDetails = new TownDetails();
            town.day = 5;
            setTown(town);
            internals.town_position = signal({ x: 10, y: 10 });
            internals.all_items = signal([]);
            internals.bank_items = signal([]);
            internals.count_available_ap = { transform: vi.fn().mockReturnValue(0) };
            internals.all_citizens = signal([Object.assign(new Citizen(), { id: CITIZEN_ID, is_dead: false })]);
            internals.scouts_lair_built = signal(true);
        });

        afterEach(() => {
            setTown(null);
        });

        // 5 km : 3 pas partent à moins de 3 km (PA), 2 à 3 km ou plus (PE).
        it('warns when the route costs more than base AP, bag and SP', () => {
            const check: ApCheck | null = internals.apWarning(expeditionOf(partWith(routeOut(5), placeWith({ citizen_id: CITIZEN_ID, base_ap: 4 }))), 0, 0, 5);

            expect(check).toEqual({ needed: 5, available: 4, short: true });
        });

        it('does not warn when the bag covers the missing AP', () => {
            internals.count_available_ap.transform.mockReturnValue(1);

            const check: ApCheck | null = internals.apWarning(expeditionOf(partWith(routeOut(5), placeWith({ citizen_id: CITIZEN_ID, base_ap: 4 }))), 0, 0, 5);

            expect(check?.short).toBe(false);
        });

        it('counts the SP of the placed citizen and the ruin visits', () => {
            internals.all_citizens.set([Object.assign(new Citizen(), { id: CITIZEN_ID, is_dead: false, shoes_equipped: true })]);
            const explore: ExpeditionOrder = Object.assign(new ExpeditionOrder(), { kind: 'explore' });

            const check: ApCheck | null = internals.apWarning(expeditionOf(partWith(routeOut(5), placeWith({ citizen_id: CITIZEN_ID }), [explore])), 0, 0, 5);

            expect(check).toEqual({ needed: 5, available: 6, short: false });
        });

        it('checks an empty place against its SP requirement', () => {
            const check: ApCheck | null = internals.apWarning(expeditionOf(partWith(routeOut(5), placeWith({ required_sp: 2 }))), 0, 0, 5);

            expect(check?.needed).toBe(3);
        });

        it('does not check an empty place without requirement', () => {
            expect(internals.apWarning(expeditionOf(partWith(routeOut(5), placeWith({}))), 0, 0, 5)).toBeNull();
        });

        it('does not check an expedition without any route', () => {
            expect(internals.apWarning(expeditionOf(partWith(null, placeWith({ citizen_id: CITIZEN_ID, base_ap: 0 }))), 0, 0, 5)).toBeNull();
        });

        it('adds the parts up, with the resources of the first part', () => {
            const expedition: Expedition = expeditionOf(
                partWith(routeOut(2), placeWith({ citizen_id: CITIZEN_ID, base_ap: 3 })),
                partWith(routeOut(2), placeWith({ citizen_id: CITIZEN_ID, base_ap: 99 }))
            );

            expect(internals.apWarning(expedition, 0, 0, 5)).toEqual({ needed: 4, available: 3, short: true });
            expect(internals.apWarning(expedition, 1, 0, 5)).toEqual({ needed: 4, available: 3, short: true });
        });

        it('gives each row the check of the person shown on it, whatever her rank in each part', () => {
            internals.all_citizens.set([
                Object.assign(new Citizen(), { id: CITIZEN_ID, is_dead: false }),
                Object.assign(new Citizen(), { id: 8, is_dead: false })
            ]);
            const explore: ExpeditionOrder = Object.assign(new ExpeditionOrder(), { kind: 'explore' });
            const expedition: Expedition = expeditionOf(
                partWithPlaces(routeOut(2), placeWith({ citizen_id: CITIZEN_ID, base_ap: 3 }), placeWith({ citizen_id: 8, base_ap: 10 })),
                partWithPlaces(routeOut(2), placeWith({ citizen_id: 8, base_ap: 99, orders: [explore] }), placeWith({ citizen_id: CITIZEN_ID, base_ap: 99 }))
            );
            const first_person: ApCheck = { needed: 4, available: 3, short: true };
            const second_person: ApCheck = { needed: 5, available: 10, short: false };

            expect(internals.apWarning(expedition, 0, 0, 5)).toEqual(first_person);
            expect(internals.apWarning(expedition, 0, 1, 5)).toEqual(second_person);
            expect(internals.apWarning(expedition, 1, 0, 5)).toEqual(second_person);
            expect(internals.apWarning(expedition, 1, 1, 5)).toEqual(first_person);
        });

        it('counts, for an empty place, only the parts whose place of the same rank is empty', () => {
            const expedition: Expedition = expeditionOf(
                partWithPlaces(routeOut(2), placeWith({ required_sp: 0, base_ap: 3 })),
                partWithPlaces(routeOut(2)),
                partWithPlaces(routeOut(2), placeWith({ citizen_id: CITIZEN_ID }))
            );

            expect(internals.apWarning(expedition, 0, 0, 5)).toEqual({ needed: 2, available: 3, short: false });
        });

        it('follows the person of the first part in each part, whatever its rank there', () => {
            const explore: ExpeditionOrder = Object.assign(new ExpeditionOrder(), { kind: 'explore' });
            const expedition: Expedition = expeditionOf(
                partWithPlaces(routeOut(2), placeWith({ citizen_id: CITIZEN_ID }), placeWith({ citizen_id: 8 })),
                partWithPlaces(routeOut(2), placeWith({ citizen_id: 8 }), placeWith({ citizen_id: CITIZEN_ID, orders: [explore] }))
            );

            expect(internals.apWarning(expedition, 0, 0, 5)).toEqual({ needed: 5, available: 6, short: false });
        });

        it('does not count a part where the person of the first part has no place', () => {
            const expedition: Expedition = expeditionOf(
                partWithPlaces(routeOut(2), placeWith({ citizen_id: CITIZEN_ID })),
                partWithPlaces(routeOut(2), placeWith({ citizen_id: 8 }))
            );

            expect(internals.apWarning(expedition, 0, 0, 5)?.needed).toBe(2);
        });

        it('follows the rank of an empty place of the first part', () => {
            const explore: ExpeditionOrder = Object.assign(new ExpeditionOrder(), { kind: 'explore' });
            const expedition: Expedition = expeditionOf(
                partWithPlaces(routeOut(2), placeWith({ required_sp: 0 })),
                partWithPlaces(routeOut(2), placeWith({ orders: [explore] }))
            );

            expect(internals.apWarning(expedition, 0, 0, 5)?.needed).toBe(5);
        });

        it('counts the mapping SP of a future expedition only with the Scouts Lair', () => {
            const expedition: Expedition = expeditionOf(partWith(routeOut(5), placeWith({ citizen_id: CITIZEN_ID, base_ap: 4 })));

            expect(internals.apWarning(expedition, 0, 0, 6)?.needed).toBe(3);
            internals.scouts_lair_built = signal(false);
            expect(internals.apWarning(expedition, 0, 0, 6)?.needed).toBe(5);
        });

        it('details the check in the tooltip', () => {
            const label: string = internals.apWarningLabel({ needed: 14, available: 12, short: true });

            expect(label).toContain('14 PA nécessaires');
            expect(label).toContain('12 PA disponibles');
        });

        it('shows the requirement with its symbol, else the SP of the placed citizen', () => {
            expect(internals.spDisplay(placeWith({ required_sp: 2 }), 5)).toBe('≥ 2');
            expect(internals.spDisplay(placeWith({ required_sp: 2, required_sp_operator: 'max' }), 5)).toBe('≤ 2');
            expect(internals.spDisplay(placeWith({ required_sp: 0, required_sp_operator: 'exact' }), 5)).toBe('= 0');
            expect(internals.spDisplay(placeWith({ citizen_id: CITIZEN_ID }), 6)).toBe('2');
            expect(internals.spDisplay(placeWith({}), 5)).toBe('');
        });

        it('shows the SP of the placed citizen without the assumed mapping when the Scouts Lair is not built', () => {
            internals.scouts_lair_built = signal(false);

            expect(internals.spDisplay(placeWith({ citizen_id: CITIZEN_ID }), 6)).toBe('0');
        });

        it('saves the SP requirement, or removes it at « at least 0 »', async () => {
            const place: CitizenExpedition = placeWith({});
            const expedition: Expedition = expeditionOf(partWith(null, place));

            await internals.saveSpRequirement(expedition, 0, 0, 'exact');
            expect(realtime_expeditions_service.updateExpeditionCitizen).toHaveBeenCalledTimes(1);
            expect(place.required_sp).toBe(0);
            expect(place.required_sp_operator).toBe('exact');

            await internals.saveSpRequirement(expedition, 0, 0, 'min');
            expect(realtime_expeditions_service.updateExpeditionCitizen).toHaveBeenCalledTimes(2);
            expect(place.required_sp).toBeUndefined();
            expect(place.required_sp_operator).toBeUndefined();
        });

        it('copies a requirement to the place of the same rank in each part, each saved with its own object', async () => {
            const first_place: CitizenExpedition = placeWith({ id: 10 });
            const second_place: CitizenExpedition = placeWith({ id: 20, requires_shoes: false });
            const first_part: ExpeditionPart = partWith(null, first_place);
            const second_part: ExpeditionPart = partWith(null, second_place);

            await internals.saveRequirement(expeditionOf(first_part, second_part), 0, { requires_shoes: true });

            const calls: [ExpeditionPart, CitizenExpedition][] = realtime_expeditions_service.updateExpeditionCitizen.mock.calls;
            expect(calls.length).toBe(2);
            expect(calls[0][0]).toBe(first_part);
            expect(calls[0][1]).toBe(first_place);
            expect(calls[1][0]).toBe(second_part);
            expect(calls[1][1]).toBe(second_place);
            expect(first_place.requires_shoes).toBe(true);
            expect(second_place.requires_shoes).toBe(true);
        });
    });
});

describe('ExpeditionsComponent — rendu de l\'avertissement de PA', () => {
    const CITIZEN_ID: number = 7;
    let fixture: ComponentFixture<ExpeditionsComponent>;
    let duplicate_expedition: Mock<(expedition: Expedition, label: string | null, choices: ExpeditionDuplicateChoices) => Promise<void>>;
    let update_expedition_citizen: Mock<() => Promise<void>>;

    /** Ville en (10, 10) ; tracé de 5 km vers le sud : 3 pas en PA, 2 en PE. */
    function map(): Town {
        const cells: Cell[] = Array.from({ length: 6 }, (_: unknown, index: number): Cell => Object.assign(new Cell(), {
            x: 10, y: 10 + index, is_town: index === 0, is_never_visited: false, is_dryed: false, max_potential_remaining_dig: 5, ruin_id: 0, nb_ruin_dig: 0
        }));
        return Object.assign(new Town(), { town_x: 10, town_y: 10, map_width: 25, map_height: 25, cells });
    }

    function expedition(base_ap: number): Expedition {
        const route: ExpeditionPartRoute = { id: 1, label: 'Sud', color: DEFAULT_MAP_ROUTE_COLOR, cells: map().cells.map((cell: Cell): MapRoutePoint => ({ x: cell.x, y: cell.y })), length: 5, version: 1 };
        const place: CitizenExpedition = Object.assign(new CitizenExpedition(), { id: 3, citizen_id: CITIZEN_ID, base_ap, orders: [] });
        const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 2, position: 0, map_route_id: route.id, map_route: route, orders: [], citizens: [place] });
        return Object.assign(new Expedition(), { id: 1, state: 'ready', label: 'Sud', position: 0, parts: [part] });
    }

    /** Rend la page en simple observateur (pas de hub) au jour 5, avec une expédition. */
    async function render(base_ap: number, items: Item[] = [Object.assign(new Item(), { id: 1, uid: 'water_#00' })]): Promise<HTMLElement> {
        const citizens: CitizenInfo = new CitizenInfo();
        citizens.citizens = [Object.assign(new Citizen(), { id: CITIZEN_ID, name: 'Alice', is_dead: false })];
        vi.spyOn(TestBed.inject(TownService), 'getCitizens').mockReturnValue(of(citizens));
        vi.spyOn(TestBed.inject(TownService), 'getMap').mockReturnValue(of(map()));
        vi.spyOn(TestBed.inject(ApiService), 'getItems').mockReturnValue(of(items));
        vi.spyOn(TestBed.inject(ExpeditionService), 'getExpeditions').mockReturnValue(of([expedition(base_ap)]));

        fixture = TestBed.createComponent(ExpeditionsComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    beforeEach(() => {
        // Le vrai service ouvre la connexion au hub dès sa construction (MapRoutesStore l'injecte) : ici, flux muets.
        duplicate_expedition = vi.fn().mockReturnValue(Promise.resolve());
        update_expedition_citizen = vi.fn().mockReturnValue(Promise.resolve());
        const calls: Record<string, unknown> = {
            duplicateExpedition: duplicate_expedition,
            updateExpeditionCitizen: update_expedition_citizen,
            joinPresence: vi.fn().mockReturnValue(Promise.resolve()),
            leavePresence: vi.fn().mockReturnValue(Promise.resolve())
        };
        const realtime: Record<string, unknown> = new Proxy<Record<string, unknown>>(calls, {
            get: (target: Record<string, unknown>, key: string | symbol): unknown => typeof key === 'string' && key in target ? target[key] : NEVER
        });
        TestBed.configureTestingModule({
            imports: [ExpeditionsComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]),
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: RealtimeExpeditionsService, useValue: realtime },
                { provide: BuiltBuildingsService, useValue: { builtUids: (): Observable<ReadonlySet<string> | null> => of(null) } }
            ]
        });
        const town: TownDetails = new TownDetails();
        town.day = 5;
        TestBed.inject(TownContextService).setObservedTown(town);
    });

    afterEach(() => {
        TestBed.inject(TownContextService).clear();
        localStorage.removeItem(EXPEDITIONS_EDITION_MODE_KEY);
    });

    it('cycles the SP operator from its button in edition mode', async () => {
        localStorage.setItem(EXPEDITIONS_EDITION_MODE_KEY, 'true');
        TestBed.inject(TownContextService).setObservedAccess({ is_citizen: true, is_current_town: true, can_create: true });

        const element: HTMLElement = await render(5);
        const button: HTMLButtonElement = element.querySelector('tr.citizen td.sp button.sp-operator') as HTMLButtonElement;
        expect(button.textContent?.trim()).toBe('≥');

        button.click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(update_expedition_citizen).toHaveBeenCalledTimes(1);
        expect(button.textContent?.trim()).toBe('≤');
    });

    it('does not save the places when they are displayed in edition mode', async () => {
        localStorage.setItem(EXPEDITIONS_EDITION_MODE_KEY, 'true');
        TestBed.inject(TownContextService).setObservedAccess({ is_citizen: true, is_current_town: true, can_create: true });

        await render(5);
        await fixture.whenStable();

        expect(update_expedition_citizen).not.toHaveBeenCalled();
    });

    it('offers to duplicate or delete an expedition from its menu in edition mode', async () => {
        localStorage.setItem(EXPEDITIONS_EDITION_MODE_KEY, 'true');
        TestBed.inject(TownContextService).setObservedAccess({ is_citizen: true, is_current_town: true, can_create: true });
        const choices: ExpeditionDuplicateChoices = { keepRoute: true, keepGeneralOrders: true, keepRouteOrders: true };
        const open_dialog: MockInstance = vi.spyOn(TestBed.inject(MatDialog), 'open')
            .mockReturnValueOnce(<MatDialogRef<unknown>><unknown>{ afterClosed: (): Observable<ExpeditionDuplicateChoices> => of(choices) })
            .mockReturnValue(<MatDialogRef<unknown>><unknown>{ afterClosed: (): Observable<boolean> => NEVER });
        const element: HTMLElement = await render(5);

        function chooseInMenu(action: string): void {
            element.querySelector<HTMLButtonElement>('button[data-action="expedition-menu"]')?.click();
            fixture.detectChanges();
            document.querySelector<HTMLButtonElement>(`button[data-action="${action}"]`)?.click();
            fixture.detectChanges();
        }

        chooseInMenu('duplicate-expedition');
        expect(open_dialog).toHaveBeenCalledWith(ExpeditionDuplicateDialogComponent, { data: { hasRoute: true } });
        expect(duplicate_expedition).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'Sud (copie)', choices);
        await fixture.whenStable();

        chooseInMenu('delete-expedition');
        expect(open_dialog).toHaveBeenCalledTimes(2);
    });

    it('loads the expeditions of the day picked in the day selector, past the next day', async () => {
        const element: HTMLElement = await render(5);
        const next: HTMLButtonElement | null = element.querySelector<HTMLButtonElement>('button[data-action="next-day"]');
        expect(element.querySelector('.day')?.textContent).toContain('J5');

        next?.click();
        await fixture.whenStable();
        fixture.detectChanges();
        next?.click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(TestBed.inject(ExpeditionService).getExpeditions).toHaveBeenLastCalledWith(7);
        expect(element.querySelector('.day')?.textContent).toContain('J7');
        expect(next?.disabled).toBe(false);
    });

    it('shows the warning on a place which cannot pay its route', async () => {
        const element: HTMLElement = await render(4);

        expect(element.querySelector('tr.citizen td.pseudo')).toBeTruthy();
        expect(element.querySelector('tr.citizen td.pseudo > div.flex > .ap-warning')).toBeTruthy();
    });

    it('shows no warning on a place which can pay its route', async () => {
        const element: HTMLElement = await render(5);

        expect(element.querySelector('tr.citizen td.pseudo')).toBeTruthy();
        expect(element.querySelector('.ap-warning')).toBeNull();
    });

    it('names the shoes icon after the item', async () => {
        const shoes: Item = Object.assign(new Item(), { id: 2, uid: 'shoe_#00', img: 'item/item_shoe.gif', label: { [moment.locale()]: 'Chaussures de sport usées' } });

        const element: HTMLElement = await render(5, [shoes]);

        expect(element.querySelector('thead td.shoes img')?.getAttribute('alt')).toBe('Chaussures de sport usées');
        expect(element.querySelector('tr.citizen td.shoes img.cell-label')?.getAttribute('alt')).toBe('Chaussures de sport usées');
    });
});
