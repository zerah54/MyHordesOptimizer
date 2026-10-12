import { Subject } from 'rxjs';
import type { Mock } from 'vitest';

import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { ExpeditionPartShortDTO } from '../dto/expedition-part.dto';
import { MapRouteDTO, MapRouteRequestDTO } from '../dto/map-route.dto';
import { CitizenExpeditionBag } from '../types/citizen-expedition-bag.class';
import { Expedition } from '../types/expedition.class';
import { ExpeditionOrder } from '../types/expedition-order.class';
import { ExpeditionPart } from '../types/expedition-part.class';
import { MapRoute } from '../types/map-route.class';
import { isHubConflictError, RealtimeExpeditionsService } from './realtime-expeditions.service';

/** Méthode protégée du service, espionnée dans `beforeEach`. */
type InvokeHub = Mock<(method: string, ...args: unknown[]) => Promise<unknown>>;

interface HubInvoker {
    invokeHub(method: string, ...args: unknown[]): Promise<unknown>;
}

/** Membres privés de la reprise après reconnexion (le service est créé sans son constructeur). */
interface ReconnectInternals {
    reconnected_subject: Subject<void>;
    user_joined_subject: Subject<number[]>;
    followed_town_id: number | null;
    presence_requested: boolean;
    onReconnected(): Promise<void>;
}

describe('RealtimeExpeditionsService', () => {
    let service: RealtimeExpeditionsService;

    function invokeHub(): InvokeHub {
        return <InvokeHub>(<HubInvoker><unknown>service).invokeHub;
    }

    beforeEach(() => {
        service = Object.create(RealtimeExpeditionsService.prototype);
        vi.spyOn(<HubInvoker><unknown>service, 'invokeHub').mockReturnValue(Promise.resolve());
    });

    describe('deleteExpeditionBag', () => {
        it('invokes the DeleteExpeditionBag hub method with the bag id', async () => {
            const bag: CitizenExpeditionBag = new CitizenExpeditionBag();
            bag.bag_id = 42;

            await service.deleteExpeditionBag(bag);

            expect(invokeHub()).toHaveBeenCalledWith('DeleteExpeditionBag', 42);
        });
    });

    describe('updateExpeditionPart', () => {
        function sentPart(): ExpeditionPartShortDTO {
            const call: unknown[] = invokeHub().mock.calls[0];
            expect(call[0]).toBe('PostExpeditionPart');
            expect(call[1]).toBe(3);
            return JSON.parse(<string>call[2]);
        }

        it('sends the linked route id', async () => {
            const expedition: Expedition = Object.assign(new Expedition(), { id: 3 });
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 8, position: 0, orders: [], citizens: [], map_route_id: 5 });

            await service.updateExpeditionPart(expedition, part);

            expect(sentPart().mapRouteId).toBe(5);
        });

        it('sends null to unlink the route', async () => {
            const expedition: Expedition = Object.assign(new Expedition(), { id: 3 });
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 8, position: 0, orders: [], citizens: [], map_route_id: null });

            await service.updateExpeditionPart(expedition, part);

            expect(sentPart()).toHaveProperty('mapRouteId', null);
        });
    });

    describe('updateExpeditionPartOrders', () => {
        it('sends the whole list of the part with the cell and the typed fields of each order', async () => {
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 8 });
            const order: ExpeditionOrder = new ExpeditionOrder({
                type: 'checkbox', text: '', isDone: false, position: 0, x: 4, y: 2, kind: 'pick', itemId: 7, quantity: 2
            });

            await service.updateExpeditionPartOrders(part, [order]);

            const call: unknown[] = invokeHub().mock.calls[0];
            expect(call.slice(0, 2)).toEqual(['PostPartOrders', 8]);
            const sent: ExpeditionOrderDTO[] = JSON.parse(<string>call[2]);
            expect(sent).toEqual([expect.objectContaining({ x: 4, y: 2, kind: 'pick', itemId: 7, quantity: 2, heroSkill: null, targetUserId: null })]);
        });
    });

    describe('saveMapRoute', () => {
        it('sends the route as JSON and returns the saved route', async () => {
            const request: MapRouteRequestDTO = {
                id: null, version: null, label: 'Nord', color: null, isPrivate: false, isEditableByAll: true, sharedUserIds: [],
                cells: [{ x: 1, y: 1 }, { x: 1, y: 0 }], stops: [{ x: 1, y: 0, mode: 'best' }]
            };
            const saved: MapRouteDTO = {
                id: 7, label: 'Nord', color: 'teal', authorId: 3, authorName: 'Zerah', isPrivate: false, isEditableByAll: true, sharedUserIds: [],
                cells: request.cells, stops: request.stops, length: 1, version: 0, canEdit: true, linkedParts: [], lastUpdateInfo: null
            };
            invokeHub().mockResolvedValue(saved);

            const route: MapRoute = await service.saveMapRoute(42, request);

            expect(invokeHub()).toHaveBeenCalledWith('SaveMapRoute', 42, JSON.stringify(request));
            expect(route.id).toBe(7);
            expect(route.color).toBe('teal');
        });
    });

    describe('copyGameRoute', () => {
        it('invokes the CopyGameRoute hub method and returns the created route', async () => {
            const created: MapRouteDTO = {
                id: 12, label: 'Nord', color: 'teal', authorId: 3, authorName: 'Zerah', isPrivate: false, isEditableByAll: true, sharedUserIds: [],
                cells: [{ x: 1, y: 1 }, { x: 1, y: 0 }], stops: [{ x: 1, y: 0, mode: 'l' }], length: 1, version: 0, canEdit: true, linkedParts: [], lastUpdateInfo: null
            };
            invokeHub().mockResolvedValue(created);

            const route: MapRoute = await service.copyGameRoute(42, 5);

            expect(invokeHub()).toHaveBeenCalledWith('CopyGameRoute', 42, 5);
            expect(route.id).toBe(12);
        });
    });

    describe('deleteMapRoute', () => {
        it('invokes the DeleteMapRoute hub method with the route id', async () => {
            await service.deleteMapRoute(7);

            expect(invokeHub()).toHaveBeenCalledWith('DeleteMapRoute', 7);
        });
    });

    describe('joinTown', () => {
        let internals: ReconnectInternals;
        let reconnections: number;

        beforeEach(() => {
            internals = <ReconnectInternals><unknown>service;
            internals.reconnected_subject = new Subject<void>();
            internals.followed_town_id = null;
            reconnections = 0;
            internals.reconnected_subject.subscribe(() => {
                reconnections++;
            });
        });

        it('invokes the JoinTown hub method with the map id', async () => {
            await service.joinTown(42);

            expect(invokeHub()).toHaveBeenCalledWith('JoinTown', 42);
        });

        it('joins the followed town again after a reconnection, then signals it', async () => {
            await service.joinTown(42);
            invokeHub().mockClear();

            await internals.onReconnected();

            expect(invokeHub()).toHaveBeenCalledWith('JoinTown', 42);
            expect(reconnections).toBe(1);
        });

        it('does not follow a town the hub refused', async () => {
            invokeHub().mockRejectedValueOnce(new Error('Forbidden'));

            await expect(service.joinTown(42)).rejects.toThrow('Forbidden');
            invokeHub().mockClear();
            await internals.onReconnected();

            expect(invokeHub()).not.toHaveBeenCalled();
            expect(reconnections).toBe(1);
        });

        it('still signals the reconnection when joining again fails', async () => {
            await service.joinTown(42);
            invokeHub().mockRejectedValueOnce(new Error('Forbidden'));
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            await internals.onReconnected();

            expect(reconnections).toBe(1);
        });
    });

    describe('presence', () => {
        let internals: ReconnectInternals;
        let reconnections: number;
        let received_lists: number[][];

        beforeEach(() => {
            internals = <ReconnectInternals><unknown>service;
            internals.reconnected_subject = new Subject<void>();
            internals.user_joined_subject = new Subject<number[]>();
            internals.followed_town_id = null;
            internals.presence_requested = false;
            reconnections = 0;
            received_lists = [];
            internals.reconnected_subject.subscribe(() => {
                reconnections++;
            });
            internals.user_joined_subject.subscribe((user_ids: number[]) => {
                received_lists.push(user_ids);
            });
        });

        it('invokes the JoinPresence hub method and publishes the current list of present citizens', async () => {
            invokeHub().mockResolvedValueOnce([3, 7]);

            await service.joinPresence();

            expect(invokeHub()).toHaveBeenCalledWith('JoinPresence');
            expect(received_lists).toEqual([[3, 7]]);
        });

        it('invokes the LeavePresence hub method', async () => {
            await service.leavePresence();

            expect(invokeHub()).toHaveBeenCalledWith('LeavePresence');
        });

        it('declares the presence again after a reconnection, then signals it', async () => {
            invokeHub().mockResolvedValue([3]);
            await service.joinPresence();
            invokeHub().mockClear();

            await internals.onReconnected();

            expect(invokeHub()).toHaveBeenCalledWith('JoinPresence');
            expect(received_lists).toEqual([[3], [3]]);
            expect(reconnections).toBe(1);
        });

        it('does not declare any presence after a reconnection when the page was never opened', async () => {
            await internals.onReconnected();

            expect(invokeHub()).not.toHaveBeenCalledWith('JoinPresence');
            expect(reconnections).toBe(1);
        });

        it('does not declare the presence again after a reconnection once the page is left', async () => {
            await service.joinPresence();
            await service.leavePresence();
            invokeHub().mockClear();

            await internals.onReconnected();

            expect(invokeHub()).not.toHaveBeenCalledWith('JoinPresence');
        });

        it('joins the followed town before declaring the presence again', async () => {
            await service.joinTown(42);
            await service.joinPresence();
            invokeHub().mockClear();

            await internals.onReconnected();

            expect(invokeHub().mock.calls.map((call: unknown[]) => call[0])).toEqual(['JoinTown', 'JoinPresence']);
        });

        it('still signals the reconnection when declaring the presence again fails', async () => {
            await service.joinPresence();
            invokeHub().mockRejectedValueOnce(new Error('Forbidden'));
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            await internals.onReconnected();

            expect(reconnections).toBe(1);
        });
    });
});

describe('isHubConflictError', () => {
    it('recognizes a stale version refused by the hub', () => {
        expect(isHubConflictError(new Error('An unexpected error occurred invoking \'SaveMapRoute\' on the server. HubException: Conflict: version 3'))).toBe(true);
        expect(isHubConflictError('Conflict: version 3')).toBe(true);
    });

    it('ignores any other error', () => {
        expect(isHubConflictError(new Error('An unexpected error occurred invoking \'SaveMapRoute\' on the server.'))).toBe(false);
        expect(isHubConflictError(undefined)).toBe(false);
    });
});
