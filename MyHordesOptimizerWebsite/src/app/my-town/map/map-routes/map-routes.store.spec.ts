import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { MapRouteDTO, MapRouteRequestDTO } from '../../../_abstract_model/dto/map-route.dto';
import { RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { MapRouteService } from '../../../_abstract_model/services/map-route.service';
import { MapRoute, MapRouteChange } from '../../../_abstract_model/types/map-route.class';
import { MapRoutes } from '../../../_abstract_model/types/map-routes.class';
import { MapRoutesStore } from './map-routes.store';

function route(id: number, version: number = 0, label: string = `Tracé ${id}`): MapRoute {
    const dto: MapRouteDTO = {
        id, label, color: 'blue', authorId: 1, authorName: null, isPrivate: false, isEditableByAll: true, sharedUserIds: [],
        cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }], stops: [], length: 1, version, canEdit: true, linkedParts: [], lastUpdateInfo: null
    };
    return new MapRoute(dto);
}

function routesResponse(routes: MapRoute[], is_citizen: boolean = true): MapRoutes {
    const result: MapRoutes = new MapRoutes();
    result.access = { is_citizen, is_current_town: true, can_create: is_citizen };
    result.routes = routes;
    return result;
}

class MapRouteServiceStub {
    public getMapRoutes: (map_id: number) => Observable<MapRoutes> = vi.fn((): Observable<MapRoutes> => of(routesResponse([])));
    public getMapRoute: (map_id: number, route_id: number) => Observable<MapRoute | null> = vi.fn((): Observable<MapRoute | null> => of(null));
}

class RealtimeStub {
    public readonly changed: Subject<MapRouteChange> = new Subject<MapRouteChange>();
    public readonly deleted: Subject<number> = new Subject<number>();
    public readonly reconnected: Subject<void> = new Subject<void>();
    public readonly map_route_changed$: Observable<MapRouteChange> = this.changed.asObservable();
    public readonly map_route_deleted$: Observable<number> = this.deleted.asObservable();
    public readonly reconnected$: Observable<void> = this.reconnected.asObservable();
    public saveMapRoute: (map_id: number, request: MapRouteRequestDTO) => Promise<MapRoute> = vi.fn((): Promise<MapRoute> => Promise.resolve(route(1)));
    public deleteMapRoute: (route_id: number) => Promise<void> = vi.fn((): Promise<void> => Promise.resolve());
    public copyGameRoute: (map_id: number, game_route_id: number) => Promise<MapRoute> = vi.fn((): Promise<MapRoute> => Promise.resolve(route(12, 0, 'Copie')));
}

describe('MapRoutesStore', (): void => {
    let store: MapRoutesStore;
    let service: MapRouteServiceStub;
    let realtime: RealtimeStub;

    beforeEach((): void => {
        service = new MapRouteServiceStub();
        realtime = new RealtimeStub();
        TestBed.configureTestingModule({
            providers: [
                { provide: MapRouteService, useValue: service },
                { provide: RealtimeExpeditionsService, useValue: realtime }
            ]
        });
        store = TestBed.inject(MapRoutesStore);
    });

    function ids(): number[] {
        return store.routes().map((known: MapRoute): number => known.id);
    }

    it('loads the routes of a town, sorted by id', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(3), route(1)])));

        store.load(42);

        expect(service.getMapRoutes).toHaveBeenCalledWith(42);
        expect(store.status()).toBe('loaded');
        expect(store.map_id()).toBe(42);
        expect(ids()).toEqual([1, 3]);
        expect(store.access()?.is_citizen).toBe(true);
    });

    it('reports a loading error', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(throwError((): Error => new Error('500')));

        store.load(42);

        expect(store.status()).toBe('error');
        expect(store.routes()).toEqual([]);
    });

    it('rereads a changed route and inserts it', (): void => {
        store.load(42);
        vi.mocked(service.getMapRoute).mockReturnValue(of(route(5, 1)));

        realtime.changed.next({ id: 5, version: 1 });

        expect(service.getMapRoute).toHaveBeenCalledWith(42, 5);
        expect(ids()).toEqual([5]);
    });

    it('replaces a known route with its new version', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5, 1, 'avant')])));
        store.load(42);
        vi.mocked(service.getMapRoute).mockReturnValue(of(route(5, 2, 'après')));

        realtime.changed.next({ id: 5, version: 2 });

        expect(store.routes().map((known: MapRoute): string => known.label)).toEqual(['après']);
    });

    it('ignores the echo of a version it already has', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5, 2)])));
        store.load(42);

        realtime.changed.next({ id: 5, version: 2 });

        expect(service.getMapRoute).not.toHaveBeenCalled();
    });

    it('removes a route that is no longer visible (404 → null)', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5, 1)])));
        store.load(42);
        vi.mocked(service.getMapRoute).mockReturnValue(of(null));

        realtime.changed.next({ id: 5, version: 2 });

        expect(ids()).toEqual([]);
    });

    it('keeps the displayed version when a reread fails', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5, 1)])));
        store.load(42);
        vi.mocked(service.getMapRoute).mockReturnValue(throwError((): Error => new Error('500')));

        realtime.changed.next({ id: 5, version: 2 });

        expect(ids()).toEqual([5]);
    });

    it('removes a deleted route', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5), route(6)])));
        store.load(42);

        realtime.deleted.next(5);

        expect(ids()).toEqual([6]);
    });

    it('ignores events for an observer (no access)', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([], false)));
        store.load(42);

        realtime.changed.next({ id: 5, version: 1 });

        expect(service.getMapRoute).not.toHaveBeenCalled();
    });

    it('loads the routes again after a reconnection of the hub', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(1)])));
        store.load(42);
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(1, 2), route(4)])));

        realtime.reconnected.next();

        expect(service.getMapRoutes).toHaveBeenCalledTimes(2);
        expect(ids()).toEqual([1, 4]);
        expect(store.routes()[0].version).toBe(2);
    });

    it('does not load again after a reconnection when nothing is shown', (): void => {
        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([], false)));
        store.load(42);

        realtime.reconnected.next();

        expect(service.getMapRoutes).toHaveBeenCalledTimes(1);
    });

    it('replays the events received while loading', (): void => {
        const response: Subject<MapRoutes> = new Subject<MapRoutes>();
        vi.mocked(service.getMapRoutes).mockReturnValue(response.asObservable());
        store.load(42);
        vi.mocked(service.getMapRoute).mockReturnValue(of(route(7, 3)));

        realtime.changed.next({ id: 7, version: 3 });
        realtime.deleted.next(6);
        expect(service.getMapRoute).not.toHaveBeenCalled();

        response.next(routesResponse([route(6), route(7, 2)]));

        expect(service.getMapRoute).toHaveBeenCalledWith(42, 7);
        expect(ids()).toEqual([7]);
        expect(store.routes()[0].version).toBe(3);
    });

    it('drops the reread of a town that is no longer displayed', (): void => {
        store.load(42);
        const reread: Subject<MapRoute | null> = new Subject<MapRoute | null>();
        vi.mocked(service.getMapRoute).mockReturnValue(reread.asObservable());
        realtime.changed.next({ id: 5, version: 1 });

        vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([])));
        store.load(43);
        reread.next(route(5, 1));

        expect(store.map_id()).toBe(43);
        expect(ids()).toEqual([]);
    });

    describe('writes', (): void => {
        it('shows a saved route at once, and ignores the echo of its version', async (): Promise<void> => {
            store.load(42);
            vi.mocked(realtime.saveMapRoute).mockResolvedValue(route(9, 0, 'Nouveau'));

            const saved: MapRoute = await store.saveRoute(route(9).toRequestDto());
            realtime.changed.next({ id: 9, version: 0 });

            expect(realtime.saveMapRoute).toHaveBeenCalledWith(42, expect.objectContaining({ id: 9 }));
            expect(saved.label).toBe('Nouveau');
            expect(ids()).toEqual([9]);
            expect(service.getMapRoute).not.toHaveBeenCalled();
        });

        it('never replaces a route by an older version', async (): Promise<void> => {
            vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(9, 4, 'récent')])));
            store.load(42);
            vi.mocked(realtime.saveMapRoute).mockResolvedValue(route(9, 3, 'ancien'));

            await store.saveRoute(route(9, 2).toRequestDto());

            expect(store.routes()[0].label).toBe('récent');
        });

        it('shows the copy of a game route at once', async (): Promise<void> => {
            store.load(42);

            const copy: MapRoute = await store.copyGameRoute(5);

            expect(realtime.copyGameRoute).toHaveBeenCalledWith(42, 5);
            expect(copy.id).toBe(12);
            expect(ids()).toEqual([12]);
        });

        it('rejects a write before any town is loaded', async (): Promise<void> => {
            await expect(store.saveRoute(route(9).toRequestDto())).rejects.toThrowError();
            expect(realtime.saveMapRoute).not.toHaveBeenCalled();
        });

        it('removes a deleted route without waiting for the hub event', async (): Promise<void> => {
            vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5), route(6)])));
            store.load(42);

            await store.deleteRoute(5);

            expect(realtime.deleteMapRoute).toHaveBeenCalledWith(5);
            expect(ids()).toEqual([6]);
        });

        it('keeps the route when the deletion is refused', async (): Promise<void> => {
            vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5)])));
            store.load(42);
            vi.mocked(realtime.deleteMapRoute).mockRejectedValue(new Error('refus'));

            await expect(store.deleteRoute(5)).rejects.toThrowError('refus');
            expect(ids()).toEqual([5]);
        });

        it('reloads a route, and forgets it when it is gone', async (): Promise<void> => {
            vi.mocked(service.getMapRoutes).mockReturnValue(of(routesResponse([route(5, 1)])));
            store.load(42);
            vi.mocked(service.getMapRoute).mockReturnValue(of(route(5, 3)));

            expect((await store.reloadRoute(5))?.version).toBe(3);
            expect(store.routes()[0].version).toBe(3);

            vi.mocked(service.getMapRoute).mockReturnValue(of(null));

            expect(await store.reloadRoute(5)).toBeNull();
            expect(ids()).toEqual([]);
        });
    });
});
