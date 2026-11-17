import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';

import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { PreTown } from '../../_abstract_model/types/pre-town.class';
import { TownContextService } from '../../_core/services/town-context.service';
import { getTown } from '../../_core/utilities/localstorage.util';
import { PreTownShellComponent } from './pre-town-shell.component';

function preTown(id: number, isLinked: boolean = false): PreTown {
    return {
        preTownId: id, mapId: 1_000_000_000 + id, alias: `PV${id}`, isOrganizer: true, isLinked, linkedMapId: null, linkedAt: null, canUnlink: false, simulatedCitizens: 33,
        members: []
    };
}

describe('PreTownShellComponent', (): void => {
    let service: MockedObject<PreTownService>;
    let params: Subject<ParamMap>;
    let context: TownContextService;
    let router: Router;
    let fixture: ComponentFixture<PreTownShellComponent>;

    async function create(get: (id: number) => Observable<PreTown>): Promise<void> {
        service.get.mockImplementation(get);
        await TestBed.configureTestingModule({
            imports: [PreTownShellComponent],
            providers: [
                provideRouter([]),
                { provide: PreTownService, useValue: service },
                { provide: Title, useValue: { setTitle: vi.fn() } },
                { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } }
            ]
        }).compileComponents();
        context = TestBed.inject(TownContextService);
        context.clear();
        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture = TestBed.createComponent(PreTownShellComponent);
        fixture.detectChanges();
    }

    function open(id: string): void {
        params.next(convertToParamMap({ preTownId: id }));
        fixture.detectChanges();
    }

    beforeEach((): void => {
        params = new Subject<ParamMap>();
        service = { get: vi.fn().mockName('PreTownService.get') } as unknown as MockedObject<PreTownService>;
    });

    afterEach((): void => context.clear());

    it('sets an editable context on the pre-town pseudo-mapId and shows the outlet', async (): Promise<void> => {
        await create((id: number): Observable<PreTown> => of(preTown(id)));
        open('5');

        expect(service.get).toHaveBeenCalledWith(5);
        expect(getTown()?.town_id).toBe(1_000_000_005);
        expect(context.observedTownName()).toBe('PV5');
        expect(context.isPreTown()).toBe(true);
        expect(context.isReadonly()).toBe(false);
        expect(context.simulatedCitizens()).toBe(33);
        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    });

    it('a linked pre-town is read only', async (): Promise<void> => {
        await create((id: number): Observable<PreTown> => of(preTown(id, true)));
        open('5');

        expect(context.isReadonly()).toBe(true);
    });

    it('the frozen banner follows the context after a link/unlink done in a child page', async (): Promise<void> => {
        await create((id: number): Observable<PreTown> => of(preTown(id)));
        open('5');
        expect(fixture.nativeElement.querySelector('.pre-town-banner__frozen')).toBeNull();

        context.setPreTownEditable(false);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.pre-town-banner__frozen')).not.toBeNull();

        context.setPreTownEditable(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.pre-town-banner__frozen')).toBeNull();
    });

    it('offers a back link to the pre-town list, even while loading, never marked active', async (): Promise<void> => {
        await create((): Observable<PreTown> => new Subject<PreTown>());
        open('5');

        const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.pre-town-banner__back');
        expect(link?.getAttribute('href')).toBe('/pre-town');
        expect(link?.textContent).toContain('Mes pré-villes');
        expect(link?.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_back');
        expect(link?.classList.contains('active')).toBe(false);
    });

    it('hides the outlet while loading', async (): Promise<void> => {
        await create((): Observable<PreTown> => new Subject<PreTown>());
        open('5');

        expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
        expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    });

    it('API error (non-member): back to the list, no stuck spinner, context cleared', async (): Promise<void> => {
        await create((): Observable<PreTown> => throwError((): Error => new Error('403')));
        open('5');

        expect(router.navigate).toHaveBeenCalledWith(['/pre-town']);
        expect(context.isPreTown()).toBe(false);
        expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    });

    it('invalid id: back to the list without request', async (): Promise<void> => {
        await create((id: number): Observable<PreTown> => of(preTown(id)));
        open('abc');

        expect(service.get).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/pre-town']);
    });

    it('a stale response after an id change does not win', async (): Promise<void> => {
        const first: Subject<PreTown> = new Subject<PreTown>();
        await create((id: number): Observable<PreTown> => (id === 5 ? first : of(preTown(id))));
        open('5');
        open('6');
        first.next(preTown(5));

        expect(getTown()?.town_id).toBe(1_000_000_006);
        expect(context.observedTownName()).toBe('PV6');
    });

    it('clears the context on destroy', async (): Promise<void> => {
        await create((id: number): Observable<PreTown> => of(preTown(id)));
        open('5');
        fixture.destroy();

        expect(context.isPreTown()).toBe(false);
        expect(context.observedTown()).toBeNull();
    });
});
