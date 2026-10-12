import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';

import { RealtimeExpeditionsService } from '../../_abstract_model/realtime-services/realtime-expeditions.service';
import { MapRouteService } from '../../_abstract_model/services/map-route.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { MapRouteAccess, NO_MAP_ROUTE_ACCESS } from '../../_abstract_model/types/map-routes.class';
import { Town } from '../../_abstract_model/types/town.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownListItem, TownListPageResult } from '../../_abstract_model/types/town-list-item.model';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { setTown } from '../../_core/utilities/localstorage.util';
import { TownObserverComponent } from './town-observer.component';

const FORMER_CITIZEN: MapRouteAccess = { is_citizen: true, is_current_town: false, can_create: true };

describe('TownObserverComponent', (): void => {
    let fixture: ComponentFixture<TownObserverComponent>;
    let townService: MockedObject<TownService>;
    let mapRouteService: MockedObject<MapRouteService>;
    let realtime: MockedObject<RealtimeExpeditionsService>;
    let router: MockedObject<Router>;
    let snackbar: MockedObject<SnackbarService>;
    let paramMap$: Subject<ParamMap>;
    let context: TownContextService;

    function makeMap(overrides: Partial<Town> = {}): Town {
        return Object.assign(new Town(), {
            town_x: 1, town_y: 2, map_width: 10, map_height: 10,
            is_chaos: false, is_devasted: false, day: 7, ...overrides
        });
    }

    function makePage(items: TownListItem[]): TownListPageResult {
        return { items, totalCount: items.length, availableTypes: [], availableLanguages: [] };
    }

    function makeItem(overrides: Partial<TownListItem> = {}): TownListItem {
        return {
            id: 1, mapId: 42, name: 'Ma ville', width: 10, height: 10, townType: null,
            season: null, phase: null, language: null, score: null, isChaos: false,
            isDevasted: false, isFinished: false, citizens: [], ...overrides
        };
    }

    function ownTown(map_id: number): TownDetails {
        const details: TownDetails = new TownDetails();
        details.town_id = map_id;
        return details;
    }

    /** Les droits et le hub se résolvent après des promesses : on les laisse aboutir. */
    async function settle(): Promise<void> {
        await new Promise<void>((resolve: () => void): void => {
            setTimeout(resolve, 0);
        });
        fixture.detectChanges();
    }

    async function observe(access: MapRouteAccess, map_id: number = 42): Promise<void> {
        townService.getMap.mockReturnValue(of(makeMap({ day: 7 })));
        townService.getTownsPaged.mockReturnValue(of(makePage([makeItem({ mapId: map_id, name: 'Ma ville' })])));
        mapRouteService.getAccess.mockReturnValue(of(access));
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({ mapId: String(map_id) }));
        await settle();
    }

    beforeEach(async (): Promise<void> => {
        paramMap$ = new Subject<ParamMap>();
        townService = {
            getMap: vi.fn().mockName('TownService.getMap'),
            getTownsPaged: vi.fn().mockName('TownService.getTownsPaged')
        } as unknown as MockedObject<TownService>;
        mapRouteService = {
            getAccess: vi.fn().mockName('MapRouteService.getAccess').mockReturnValue(of(NO_MAP_ROUTE_ACCESS))
        } as unknown as MockedObject<MapRouteService>;
        realtime = {
            joinTown: vi.fn().mockName('RealtimeExpeditionsService.joinTown').mockResolvedValue(undefined)
        } as unknown as MockedObject<RealtimeExpeditionsService>;
        router = {
            navigate: vi.fn().mockName('Router.navigate')
        } as unknown as MockedObject<Router>;
        snackbar = {
            errorSnackbar: vi.fn().mockName('SnackbarService.errorSnackbar')
        } as unknown as MockedObject<SnackbarService>;

        await TestBed.configureTestingModule({
            imports: [TownObserverComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(),
                { provide: TownService, useValue: townService },
                { provide: MapRouteService, useValue: mapRouteService },
                { provide: RealtimeExpeditionsService, useValue: realtime },
                { provide: Router, useValue: router },
                { provide: SnackbarService, useValue: snackbar },
                { provide: Title, useValue: {
                    setTitle: vi.fn().mockName('Title.setTitle')
                } },
                { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } }
            ]
        }).compileComponents();

        context = TestBed.inject(TownContextService);
        context.clear();
        fixture = TestBed.createComponent(TownObserverComponent);
    });

    afterEach((): void => {
        context.clear();
        setTown(null);
    });

    it('shows the loading spinner and hides the router-outlet before the context is ready', (): void => {
        townService.getMap.mockReturnValue(of());
        townService.getTownsPaged.mockReturnValue(of());
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({ mapId: '42' }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.observer-loading')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
    });

    it('renders the town name/day banner and the router-outlet once map + page have resolved', async (): Promise<void> => {
        await observe(NO_MAP_ROUTE_ACCESS);

        expect(fixture.nativeElement.querySelector('.observer-loading')).toBeNull();
        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.observer-banner__town')?.textContent).toContain('Ma ville');
        expect(fixture.nativeElement.querySelector('.observer-banner__day')?.textContent).toContain('7');
        expect(fixture.nativeElement.querySelector('.observer-banner__former')).toBeNull();
    });

    it('keeps the town of a non-citizen read only, without opening the hub', async (): Promise<void> => {
        await observe(NO_MAP_ROUTE_ACCESS);

        expect(mapRouteService.getAccess).toHaveBeenCalledWith(42);
        expect(context.isReadonly()).toBe(true);
        expect(context.canContribute()).toBe(false);
        expect(realtime.joinTown).not.toHaveBeenCalled();
    });

    it('follows a former town in the hub and lets its citizen contribute', async (): Promise<void> => {
        await observe(FORMER_CITIZEN);

        expect(realtime.joinTown).toHaveBeenCalledWith(42);
        expect(context.isFormerCitizen()).toBe(true);
        expect(context.canContribute()).toBe(true);
        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.observer-banner__former')).not.toBeNull();
    });

    it('keeps a former town read only when the hub refuses to follow it', async (): Promise<void> => {
        realtime.joinTown.mockRejectedValue(new Error('Forbidden'));
        vi.spyOn(console, 'warn').mockImplementation((): void => undefined);

        await observe(FORMER_CITIZEN);

        expect(context.isCitizen()).toBe(true);
        expect(context.canContribute()).toBe(false);
        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.observer-banner__former')).toBeNull();
    });

    it('brings the hub back to the own town when leaving a former town', async (): Promise<void> => {
        setTown(ownTown(7));
        await observe(FORMER_CITIZEN);
        realtime.joinTown.mockClear();

        fixture.destroy();
        await new Promise<void>((resolve: () => void): void => {
            setTimeout(resolve, 0);
        });

        expect(realtime.joinTown).toHaveBeenCalledWith(7);
        expect(context.isReadonly()).toBe(false);
    });

    it('does not touch the hub when leaving the town of someone else', async (): Promise<void> => {
        setTown(ownTown(7));
        await observe(NO_MAP_ROUTE_ACCESS);

        fixture.destroy();
        await new Promise<void>((resolve: () => void): void => {
            setTimeout(resolve, 0);
        });

        expect(realtime.joinTown).not.toHaveBeenCalled();
    });

    it('redirects to the town list when mapId is missing from the route', (): void => {
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({}));
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(['/directory/towns']);
        expect(snackbar.errorSnackbar).toHaveBeenCalled();
    });

    it('redirects to the town list when the loaded page has no matching town', (): void => {
        townService.getMap.mockReturnValue(of(makeMap()));
        townService.getTownsPaged.mockReturnValue(of(makePage([makeItem({ mapId: 99 })])));
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({ mapId: '42' }));
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(['/directory/towns']);
    });

    it('redirects to the town list on load error', (): void => {
        townService.getMap.mockReturnValue(of(makeMap()));
        townService.getTownsPaged.mockReturnValue(throwError((): Error => new Error('boom')));
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({ mapId: '42' }));
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(['/directory/towns']);
    });

    it('ignores a repeated paramMap emission for the same mapId', (): void => {
        townService.getMap.mockReturnValue(of(makeMap()));
        townService.getTownsPaged.mockReturnValue(of(makePage([makeItem({ mapId: 42 })])));
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({ mapId: '42' }));
        fixture.detectChanges();

        townService.getMap.mockClear();
        paramMap$.next(convertToParamMap({ mapId: '42' }));
        fixture.detectChanges();

        expect(townService.getMap).not.toHaveBeenCalled();
    });
});
