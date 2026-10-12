import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { MapRouteAccessDTO, MapRouteDTO, MapRoutesDTO } from '../dto/map-route.dto';
import { MapRoute } from '../types/map-route.class';
import { MapRouteAccess, MapRoutes, NO_MAP_ROUTE_ACCESS } from '../types/map-routes.class';
import { MapRouteService } from './map-route.service';

function routeDto(overrides: Partial<MapRouteDTO> = {}): MapRouteDTO {
    return {
        id: 7,
        label: 'Nord-Est',
        color: 'teal',
        authorId: 3,
        authorName: 'Zerah',
        isPrivate: false,
        isEditableByAll: true,
        sharedUserIds: [],
        cells: [{ x: 12, y: 12 }, { x: 12, y: 11 }],
        stops: [{ x: 12, y: 11, mode: 'l' }],
        length: 1,
        version: 2,
        canEdit: true,
        linkedParts: [{ expeditionId: 4, partId: 9, day: 5, expeditionLabel: 'Expé 1', partPosition: 0 }],
        lastUpdateInfo: null,
        ...overrides
    };
}

describe('MapRouteService', (): void => {
    let service: MapRouteService;
    let http_mock: HttpTestingController;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        });
        service = TestBed.inject(MapRouteService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
    });

    it('getMapRoutes GET /MapRoutes/:mapId and maps access, routes and game routes', (): void => {
        let result: MapRoutes | undefined;
        service.getMapRoutes(42).subscribe((routes: MapRoutes): void => {
            result = routes;
        });

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/MapRoutes/42`);
        expect(request.request.method).toBe('GET');
        request.flush(<MapRoutesDTO>{
            access: { isCitizen: true, isCurrentTown: false, canCreate: true },
            routes: [routeDto()],
            gameRoutes: [{ id: 1, authorId: null, label: 'Lac', length: 4, stops: [{ x: 12, y: 12 }, { x: 12, y: 8 }] }]
        });

        expect(result?.access).toEqual({ is_citizen: true, is_current_town: false, can_create: true });
        expect(result?.routes[0].color).toBe('teal');
        expect(result?.routes[0].linked_parts[0]).toEqual({ expedition_id: 4, part_id: 9, day: 5, expedition_label: 'Expé 1', part_position: 0 });
        expect(result?.game_routes[0].stops).toEqual([{ x: 12, y: 12 }, { x: 12, y: 8 }]);
    });

    it('getAccess GET /MapRoutes/:mapId/access and maps the rights', (): void => {
        let result: MapRouteAccess | undefined;
        service.getAccess(42).subscribe((access: MapRouteAccess): void => {
            result = access;
        });

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/MapRoutes/42/access`);
        expect(request.request.method).toBe('GET');
        request.flush(<MapRouteAccessDTO>{ isCitizen: true, isCurrentTown: false, canCreate: true });

        expect(result).toEqual({ is_citizen: true, is_current_town: false, can_create: true });
    });

    it('getAccess falls back to no rights on error', (): void => {
        let result: MapRouteAccess | undefined;
        service.getAccess(42).subscribe((access: MapRouteAccess): void => {
            result = access;
        });

        http_mock.expectOne(`${environment.api_url}/MapRoutes/42/access`).flush(null, { status: 500, statusText: 'Server Error' });

        expect(result).toBe(NO_MAP_ROUTE_ACCESS);
    });

    it('getMapRoute GET /MapRoutes/:mapId/:routeId', (): void => {
        let result: MapRoute | null | undefined;
        service.getMapRoute(42, 7).subscribe((route: MapRoute | null): void => {
            result = route;
        });

        http_mock.expectOne(`${environment.api_url}/MapRoutes/42/7`).flush(routeDto({ color: 'unknown-key' }));

        expect(result?.id).toBe(7);
        expect(result?.color).toBe('blue');
    });

    it('getMapRoute returns null on 404 (route deleted or no longer visible)', (): void => {
        let result: MapRoute | null | undefined;
        service.getMapRoute(42, 7).subscribe((route: MapRoute | null): void => {
            result = route;
        });

        http_mock.expectOne(`${environment.api_url}/MapRoutes/42/7`).flush(null, { status: 404, statusText: 'Not Found' });

        expect(result).toBeNull();
    });

    it('getMapRoute propagates other errors', (): void => {
        let error: HttpErrorResponse | undefined;
        service.getMapRoute(42, 7).subscribe({
            error: (response: HttpErrorResponse): void => {
                error = response;
            }
        });

        http_mock.expectOne(`${environment.api_url}/MapRoutes/42/7`).flush(null, { status: 500, statusText: 'Server Error' });

        expect(error?.status).toBe(500);
    });
});
