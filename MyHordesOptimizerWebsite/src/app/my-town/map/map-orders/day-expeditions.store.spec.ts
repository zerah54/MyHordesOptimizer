import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { ExpeditionOrdersUpdate, RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ExpeditionService } from '../../../_abstract_model/services/expedition.service';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { DayExpeditionsStore } from './day-expeditions.store';
import { CellOrderEntry } from './map-cell-orders';

/** Doublure du service temps réel : des sujets que le test alimente. */
class RealtimeStub {
    public readonly expedition_updated$: Subject<Expedition> = new Subject<Expedition>();
    public readonly expeditions_updated$: Subject<Expedition[]> = new Subject<Expedition[]>();
    public readonly expedition_deleted$: Subject<number> = new Subject<number>();
    public readonly expedition_part_updated$: Subject<ExpeditionPart> = new Subject<ExpeditionPart>();
    public readonly expedition_part_deleted$: Subject<number> = new Subject<number>();
    public readonly expedition_citizen_updated$: Subject<CitizenExpedition> = new Subject<CitizenExpedition>();
    public readonly expedition_citizen_deleted$: Subject<number> = new Subject<number>();
    public readonly expedition_order_deleted$: Subject<number> = new Subject<number>();
    public readonly expedition_part_orders_updated$: Subject<ExpeditionOrdersUpdate> = new Subject<ExpeditionOrdersUpdate>();
    public readonly expedition_citizen_orders_updated$: Subject<ExpeditionOrdersUpdate> = new Subject<ExpeditionOrdersUpdate>();
    public readonly expedition_order_updated$: Subject<ExpeditionOrder> = new Subject<ExpeditionOrder>();
    public readonly reconnected$: Subject<void> = new Subject<void>();
}

function order(id: number, x: number, y: number, done: boolean = false): ExpeditionOrder {
    const result: ExpeditionOrder = new ExpeditionOrder({ id, type: 'checkbox', text: '', isDone: done, position: 0, x, y, kind: 'camp' });
    result.expeditions_id = 1;
    return result;
}

/** Expédition 1 : partie 10 (consigne 100 en (3, 4)), place 20 (consigne 200 en (5, 6)). */
function expedition(): Expedition {
    const citizen: CitizenExpedition = Object.assign(new CitizenExpedition(), { id: 20, citizen_id: 7, orders: [order(200, 5, 6)] });
    const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 10, expedition_id: 1, position: 0, orders: [order(100, 3, 4)], citizens: [citizen] });
    return Object.assign(new Expedition(), { id: 1, label: 'Nord', position: 0, parts: [part] });
}

function town(town_id: number): TownDetails {
    const details: TownDetails = new TownDetails();
    details.town_id = town_id;
    return details;
}

describe('DayExpeditionsStore', (): void => {
    let store: DayExpeditionsStore;
    let realtime: RealtimeStub;
    let responses: Subject<Expedition[]>[];
    let get_expeditions: ReturnType<typeof vi.fn>;

    function respond(expeditions: Expedition[]): void {
        const response: Subject<Expedition[]> | undefined = responses.shift();
        if (!response) throw new Error('aucune lecture en cours');
        response.next(expeditions);
        response.complete();
    }

    function ordersAt(key: string): readonly CellOrderEntry[] {
        return store.cell_orders().get(key) ?? [];
    }

    beforeEach((): void => {
        vi.useFakeTimers();
        responses = [];
        get_expeditions = vi.fn((): Subject<Expedition[]> => {
            const response: Subject<Expedition[]> = new Subject<Expedition[]>();
            responses.push(response);
            return response;
        });
        realtime = new RealtimeStub();
        TestBed.configureTestingModule({
            providers: [
                { provide: RealtimeExpeditionsService, useValue: realtime },
                { provide: ExpeditionService, useValue: { getExpeditions: get_expeditions } }
            ]
        });
        store = TestBed.inject(DayExpeditionsStore);
        setTown(town(42));
    });

    afterEach((): void => {
        setTown(null);
        vi.useRealTimers();
    });

    it('loads the expeditions of a day once, and indexes their orders by cell', (): void => {
        store.load(42, 3);
        store.load(42, 3);
        expect(get_expeditions).toHaveBeenCalledTimes(1);
        expect(get_expeditions).toHaveBeenCalledWith(3);
        expect(store.status()).toBe('loading');

        respond([expedition()]);

        expect(store.status()).toBe('loaded');
        expect(ordersAt('3,4').map((entry: CellOrderEntry): number | undefined => entry.order.id)).toEqual([100]);
        expect(ordersAt('5,6')[0].owner.kind).toBe('citizen');
    });

    it('shows nothing of a town on the map of another one', (): void => {
        store.load(42, 3);
        respond([expedition()]);

        setTown(town(77));

        expect(store.expeditions()).toEqual([]);
        expect(store.cell_orders().size).toBe(0);
    });

    it('replaces the orders of their owner from the hub, without reading again', (): void => {
        store.load(42, 3);
        respond([expedition()]);

        realtime.expedition_part_orders_updated$.next({ owner_id: 10, orders: [order(101, 8, 8)] });
        realtime.expedition_citizen_orders_updated$.next({ owner_id: 20, orders: [] });

        expect(ordersAt('3,4')).toEqual([]);
        expect(ordersAt('8,8').map((entry: CellOrderEntry): number | undefined => entry.order.id)).toEqual([101]);
        expect(ordersAt('5,6')).toEqual([]);
        vi.advanceTimersByTime(1000);
        expect(get_expeditions).toHaveBeenCalledTimes(1);
    });

    it('replaces a checked order', (): void => {
        store.load(42, 3);
        respond([expedition()]);

        realtime.expedition_order_updated$.next(order(200, 5, 6, true));

        expect(ordersAt('5,6')[0].order.is_done).toBe(true);
    });

    it('ignores the orders of other days', (): void => {
        store.load(42, 3);
        respond([expedition()]);
        const before: ReturnType<typeof store.cell_orders> = store.cell_orders();

        realtime.expedition_part_orders_updated$.next({ owner_id: 99, orders: [order(1, 1, 1)] });
        realtime.expedition_part_deleted$.next(99);
        vi.advanceTimersByTime(1000);

        expect(store.cell_orders()).toBe(before);
        expect(get_expeditions).toHaveBeenCalledTimes(1);
    });

    it('reads the day again once after a burst of changes to its expeditions', (): void => {
        store.load(42, 3);
        respond([expedition()]);

        realtime.expedition_part_updated$.next(Object.assign(new ExpeditionPart(), { id: 11, expedition_id: 1 }));
        realtime.expedition_updated$.next(new Expedition());
        realtime.expedition_citizen_deleted$.next(20);
        expect(get_expeditions).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(300);

        expect(get_expeditions).toHaveBeenCalledTimes(2);
        respond([]);
        expect(store.cell_orders().size).toBe(0);
    });

    it('reads the day again after a reconnection of the hub', (): void => {
        store.load(42, 3);
        respond([expedition()]);

        realtime.reconnected$.next();
        vi.advanceTimersByTime(300);

        expect(get_expeditions).toHaveBeenCalledTimes(2);
        respond([]);
        expect(store.cell_orders().size).toBe(0);
    });

    it('reads again when the hub changed something during a read', (): void => {
        store.load(42, 3);
        realtime.expedition_part_orders_updated$.next({ owner_id: 10, orders: [] });

        respond([expedition()]);
        // La réponse peut être antérieure à l'événement : une autre lecture suit.
        expect(ordersAt('3,4').length).toBe(1);
        vi.advanceTimersByTime(300);

        expect(get_expeditions).toHaveBeenCalledTimes(2);
    });
});
