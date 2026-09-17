import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';

import { TownService } from '../../_abstract_model/services/town.service';
import { Town } from '../../_abstract_model/types/town.class';
import { TownListItem, TownListPageResult } from '../../_abstract_model/types/town-list-item.model';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { TownObserverComponent } from './town-observer.component';

describe('TownObserverComponent', (): void => {
    let fixture: ComponentFixture<TownObserverComponent>;
    let townService: MockedObject<TownService>;
    let router: MockedObject<Router>;
    let snackbar: MockedObject<SnackbarService>;
    let paramMap$: Subject<ParamMap>;

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

    beforeEach(async (): Promise<void> => {
        paramMap$ = new Subject<ParamMap>();
        townService = {
            getMap: vi.fn().mockName('TownService.getMap'),
            getTownsPaged: vi.fn().mockName('TownService.getTownsPaged')
        } as unknown as MockedObject<TownService>;
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
                { provide: Router, useValue: router },
                { provide: SnackbarService, useValue: snackbar },
                { provide: Title, useValue: {
                    setTitle: vi.fn().mockName('Title.setTitle')
                } },
                { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } }
            ]
        }).compileComponents();

        TestBed.inject(TownContextService).clear();
        fixture = TestBed.createComponent(TownObserverComponent);
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

    it('renders the town name/day banner and the router-outlet once map + page have resolved', (): void => {
        townService.getMap.mockReturnValue(of(makeMap({ day: 7 })));
        townService.getTownsPaged.mockReturnValue(of(makePage([makeItem({ mapId: 42, name: 'Ma ville' })])));
        fixture.detectChanges();
        paramMap$.next(convertToParamMap({ mapId: '42' }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.observer-loading')).toBeNull();
        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.observer-banner__town')?.textContent).toContain('Ma ville');
        expect(fixture.nativeElement.querySelector('.observer-banner__day')?.textContent).toContain('7');
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
