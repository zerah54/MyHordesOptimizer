import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, InputSignal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { DrawMapComponent } from './draw-map/draw-map.component';
import { MapComponent, MapOptions } from './map.component';

/** Remplace mho-draw-map : capture les entrées reçues sans instancier la grille de carte réelle (MatDialog/TownContextService). */
@Component({ selector: 'mho-draw-map', template: '', standalone: true })
class DrawMapStubComponent {
    public readonly map: InputSignal<Town | undefined> = input();
    public readonly allItems: InputSignal<Item[] | undefined> = input();
    public readonly allRuins: InputSignal<Ruin[] | undefined> = input();
    public readonly allCitizens: InputSignal<Citizen[] | undefined> = input();
    public readonly options: InputSignal<MapOptions | undefined> = input();
}

function newTown(): Town {
    const town: Town = new Town();
    town.town_x = 0;
    town.town_y = 0;
    town.map_width = 1;
    town.cells = [];
    return town;
}

describe('MapComponent', (): void => {
    let fixture: ComponentFixture<MapComponent>;
    let apiService: ApiService;
    let townService: TownService;
    let breakpointObserver: BreakpointObserver;

    beforeEach(async (): Promise<void> => {
        localStorage.removeItem('MAP_OPTIONS');

        await TestBed.configureTestingModule({
            imports: [MapComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        })
            .overrideComponent(MapComponent, {
                remove: { imports: [DrawMapComponent] },
                add: { imports: [DrawMapStubComponent] }
            })
            .compileComponents();

        apiService = TestBed.inject(ApiService);
        townService = TestBed.inject(TownService);
        breakpointObserver = TestBed.inject(BreakpointObserver);
    });

    afterEach((): void => localStorage.removeItem('MAP_OPTIONS'));

    function create(is_gt_xs: boolean = true): void {
        spyOn(breakpointObserver, 'isMatched').and.returnValue(is_gt_xs);
        spyOn(townService, 'getMap').and.returnValue(of());
        spyOn(apiService, 'getRuins').and.returnValue(of());
        spyOn(apiService, 'getItems').and.returnValue(of());
        spyOn(townService, 'getCitizens').and.returnValue(of());
        fixture = TestBed.createComponent(MapComponent);
    }

    function drawMapStub(): DrawMapStubComponent {
        return fixture.debugElement.query((de) => de.componentInstance instanceof DrawMapStubComponent).componentInstance;
    }

    it('passes undefined map/items/ruins/citizens to draw-map before the API calls resolve', (): void => {
        create();
        fixture.detectChanges();

        const stub: DrawMapStubComponent = drawMapStub();
        expect(stub.map()).toBeUndefined();
        expect(stub.allItems()).toBeUndefined();
        expect(stub.allRuins()).toBeUndefined();
        expect(stub.allCitizens()).toBeUndefined();
    });

    it('passes the resolved map/items/ruins/citizens to draw-map once the API calls complete', (): void => {
        create();
        fixture.detectChanges();

        const town: Town = newTown();
        const ruins: Ruin[] = [new Ruin()];
        const items: Item[] = [new Item()];
        const citizen_info: CitizenInfo = new CitizenInfo();
        citizen_info.citizens = [new Citizen()];

        (townService.getMap as jasmine.Spy).and.returnValue(of(town));
        (apiService.getRuins as jasmine.Spy).and.returnValue(of(ruins));
        (apiService.getItems as jasmine.Spy).and.returnValue(of(items));
        (townService.getCitizens as jasmine.Spy).and.returnValue(of(citizen_info));
        fixture = TestBed.createComponent(MapComponent);
        fixture.detectChanges();

        const stub: DrawMapStubComponent = drawMapStub();
        expect(stub.map()).toBe(town);
        expect(stub.allRuins()).toBe(ruins);
        expect(stub.allItems()).toBe(items);
        expect(stub.allCitizens()).toBe(citizen_info.citizens);
    });

    it('loads default map options when localStorage has none, defaulting to the digs map type', (): void => {
        create();
        fixture.detectChanges();

        const digsChip: HTMLElement = fixture.nativeElement.querySelectorAll('mat-chip')[0];
        expect(digsChip.classList).toContain('mat-mdc-chip-highlighted');
    });

    it('renders the sidenav in "side" mode when the gt-xs breakpoint matches, and "over" when it does not', (): void => {
        create(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-side');

        (breakpointObserver.isMatched as jasmine.Spy).and.returnValue(false);
        window.dispatchEvent(new Event('resize'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-over');
    });

    it('changeOptions() updates the highlighted chip and persists to localStorage', (done: DoneFn): void => {
        create();
        fixture.detectChanges();

        const chips: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('mat-chip');
        const dangerChip: HTMLElement = Array.from(chips).find((chip: HTMLElement) => chip.textContent?.includes('Danger')) as HTMLElement;
        dangerChip.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(dangerChip.classList).toContain('mat-mdc-chip-highlighted');

        setTimeout((): void => {
            const stored: MapOptions = JSON.parse(localStorage.getItem('MAP_OPTIONS') as string);
            expect(stored.map_type).toBe('danger');
            done();
        });
    });

    it('checkIfAllOptionsExist() fills a missing key from a partial localStorage payload with the default value', (): void => {
        localStorage.setItem('MAP_OPTIONS', JSON.stringify({ map_type: 'trash' }));
        create();
        fixture.detectChanges();

        const stub: DrawMapStubComponent = drawMapStub();
        expect(stub.options()?.dig_mode).toBe('average');
        expect(stub.options()?.distances).toEqual([]);
    });

    it('addDistanceToList() adds a new distance option and renders it in the list, ignoring an exact duplicate', fakeAsync((): void => {
        create();
        fixture.detectChanges();

        const testable: { new_distance_option: { value: number; unit: 'km' | 'pa'; round_trip?: boolean }; addDistanceToList(): void } =
            fixture.componentInstance as unknown as typeof testable;
        testable.new_distance_option.value = 5;
        testable.new_distance_option.unit = 'km';
        testable.addDistanceToList();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(1);
        expect(fixture.nativeElement.querySelector('mat-list-item [matListItemTitle]').textContent).toContain('5');

        testable.addDistanceToList();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(1);
    }));

    it('removeDistanceFromList() removes a matching distance option from the list', fakeAsync((): void => {
        create();
        fixture.detectChanges();

        const testable: {
            new_distance_option: { value: number; unit: 'km' | 'pa'; round_trip?: boolean };
            addDistanceToList(): void;
            removeDistanceFromList(distance: { value: number; unit: 'km' | 'pa'; round_trip?: boolean }): void;
        } = fixture.componentInstance as unknown as typeof testable;
        testable.new_distance_option.value = 5;
        testable.new_distance_option.unit = 'km';
        testable.addDistanceToList();
        tick();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(1);

        testable.removeDistanceFromList({ value: 5, unit: 'km' });
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(0);
    }));
});
