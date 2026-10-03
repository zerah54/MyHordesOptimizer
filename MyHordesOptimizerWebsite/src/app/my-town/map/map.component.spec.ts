import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE, ChangeDetectionStrategy, Component, DebugElement, input, InputSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { Mock } from 'vitest';

import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { DrawMapComponent } from './draw-map/draw-map.component';
import { MapComponent, MapOptions } from './map.component';
import { DEFAULT_CORNERS } from './map-corners';

/** Remplace mho-draw-map : capture les entrées reçues sans instancier la grille de carte réelle (MatDialog/TownContextService). */
@Component({ selector: 'mho-draw-map', template: '', changeDetection: ChangeDetectionStrategy.OnPush,
             standalone: true })
class DrawMapStubComponent {
    public readonly map: InputSignal<Town | undefined> = input();
    public readonly allItems: InputSignal<Item[] | undefined> = input();
    public readonly allRuins: InputSignal<Ruin[] | undefined> = input();
    public readonly allCitizens: InputSignal<Citizen[] | undefined> = input();
    public readonly options: InputSignal<MapOptions | undefined> = input();
    public readonly zoom: InputSignal<number | undefined> = input();
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
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        })
            .overrideComponent(MapComponent, {
                remove: { imports: [DrawMapComponent] },
                add: { imports: [DrawMapStubComponent] }
            })
            .compileComponents();

        apiService = TestBed.inject(ApiService);
        townService = TestBed.inject(TownService);
        breakpointObserver = TestBed.inject(BreakpointObserver);
        // jsdom n'implémente pas ResizeObserver (contrairement à Chrome sous Karma) : mhoScrollAura
        // (utilisé par ce template) en a besoin dans ngAfterViewInit, sans quoi la création du
        // composant lève systématiquement une ReferenceError, y compris hors de tout test fakeAsync.
        vi.stubGlobal('ResizeObserver', class {
            public observe(): void {}
            public unobserve(): void {}
            public disconnect(): void {}
        });
        vi.useFakeTimers();
    });

    afterEach((): void => {
        localStorage.removeItem('MAP_OPTIONS');
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    function create(is_gt_xs: boolean = true): void {
        vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(is_gt_xs);
        vi.spyOn(townService, 'getMap').mockReturnValue(of());
        vi.spyOn(apiService, 'getRuins').mockReturnValue(of());
        vi.spyOn(apiService, 'getItems').mockReturnValue(of());
        vi.spyOn(townService, 'getCitizens').mockReturnValue(of());
        fixture = TestBed.createComponent(MapComponent);
    }

    function drawMapStub(): DrawMapStubComponent {
        return fixture.debugElement.query((de: DebugElement): boolean => de.componentInstance instanceof DrawMapStubComponent).componentInstance;
    }

    /** Un segment du contrôle « Type de carte », repéré par son libellé. */
    function mapTypeToggle(label: string): HTMLElement {
        const toggles: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.mho-map-seg mat-button-toggle'));
        return toggles.find((toggle: HTMLElement): boolean => !!toggle.textContent?.includes(label)) as HTMLElement;
    }

    function clickMapType(label: string): void {
        (mapTypeToggle(label).querySelector('button') as HTMLButtonElement).click();
        fixture.detectChanges();
    }

    /** Les boutons de zoom sont repérés par le nom de leur icône Material : c'est ce que voit
     *  l'utilisateur, et cela ne dépend pas de leur position dans la barre d'outils. */
    function zoomButton(icon: string): HTMLButtonElement {
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.mho-map-tools button'));
        return buttons.find((button: HTMLButtonElement): boolean => button.textContent?.trim() === icon) as HTMLButtonElement;
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

        (townService.getMap as Mock).mockReturnValue(of(town));
        (apiService.getRuins as Mock).mockReturnValue(of(ruins));
        (apiService.getItems as Mock).mockReturnValue(of(items));
        (townService.getCitizens as Mock).mockReturnValue(of(citizen_info));
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

        expect(mapTypeToggle('Fouilles').classList).toContain('mat-button-toggle-checked');
    });

    it('renders the sidenav in "side" mode when the gt-xs breakpoint matches, and "over" when it does not', (): void => {
        create(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-side');

        (breakpointObserver.isMatched as Mock).mockReturnValue(false);
        window.dispatchEvent(new Event('resize'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-over');
    });

    it('changeOptions() updates the highlighted chip and persists to localStorage', (): void => {
        create();
        fixture.detectChanges();

        clickMapType('Danger');

        expect(mapTypeToggle('Danger').classList).toContain('mat-button-toggle-checked');

        const stored: MapOptions = JSON.parse(localStorage.getItem('MAP_OPTIONS') as string);
        expect(stored.map_type).toBe('danger');
    });

    it('changing the map type gives the cells a new options reference, changing only the zoom does not', (): void => {
        create();
        fixture.detectChanges();

        const stub: DrawMapStubComponent = drawMapStub();
        const before: MapOptions | undefined = stub.options();

        zoomButton('zoom_in').click();
        fixture.detectChanges();
        expect(stub.zoom()).toBe(34);
        expect(stub.options()).toBe(before);

        clickMapType('Danger');

        expect(stub.options()).not.toBe(before);
        expect(stub.options()?.map_type).toBe('danger');
    });

    it('clamps a stored zoom that is out of range back to the default', (): void => {
        localStorage.setItem('MAP_OPTIONS', JSON.stringify({ zoom: 500 }));
        create();
        fixture.detectChanges();

        expect(drawMapStub().zoom()).toBe(72);
    });

    it('falls back to the default options when the stored payload is not valid JSON', (): void => {
        localStorage.setItem('MAP_OPTIONS', 'not json');
        create();
        fixture.detectChanges();

        expect(drawMapStub().options()?.map_type).toBe('digs');
        expect(drawMapStub().zoom()).toBe(30);
    });

    it('fills a missing key from a partial localStorage payload with the default value', (): void => {
        localStorage.setItem('MAP_OPTIONS', JSON.stringify({ map_type: 'trash' }));
        create();
        fixture.detectChanges();

        const stub: DrawMapStubComponent = drawMapStub();
        expect(stub.options()?.dig_mode).toBe('average');
        expect(stub.options()?.distances).toEqual([]);
    });

    it('restores a stored corner layout and fills the corners it does not know with their default', (): void => {
        localStorage.setItem('MAP_OPTIONS', JSON.stringify({ corners: { digs: { top_left: 'update_age', bottom_right: 'inconnu' } } }));
        create();
        fixture.detectChanges();

        const options: MapOptions | undefined = drawMapStub().options();
        expect(options?.corners.digs.top_left).toBe('update_age');
        expect(options?.corners.digs.bottom_right).toBe(DEFAULT_CORNERS.digs.bottom_right);
        expect(options?.corners.danger).toEqual(DEFAULT_CORNERS.danger);
    });

    it('changeCorner() only changes the layout of the displayed map type, persists it, and resetCorners() restores it', (): void => {
        create();
        fixture.detectChanges();
        const testable: { changeCorner(position: string, info: string): void; resetCorners(): void } =
            <{ changeCorner(position: string, info: string): void; resetCorners(): void }><unknown>fixture.componentInstance;
        const before: MapOptions | undefined = drawMapStub().options();

        testable.changeCorner('bottom_left', 'items');
        fixture.detectChanges();

        const stored: MapOptions = JSON.parse(localStorage.getItem('MAP_OPTIONS') as string);
        expect(stored.corners.digs.bottom_left).toBe('items');
        expect(stored.corners.danger).toEqual(DEFAULT_CORNERS.danger);
        // Les cases doivent être rafraîchies : nouvelle référence d'options.
        expect(drawMapStub().options()).not.toBe(before);

        testable.resetCorners();
        fixture.detectChanges();

        expect(drawMapStub().options()?.corners.digs).toEqual(DEFAULT_CORNERS.digs);
    });

    it('shows the legend of the displayed map type, with the game labels and an unknown entry', (): void => {
        create();
        fixture.detectChanges();
        const labels: () => string[] = (): string[] => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.map-legend .label'))
            .map((label: Element): string => label.textContent?.trim() ?? '');

        expect(labels()).toEqual(['Zone épuisée', 'Zone presque épuisée', 'Zone à moitié vide', 'Zone abondante']);

        clickMapType('Exploration');
        expect(labels()).toEqual(['Secteur peu connu', 'Secteur partiellement repéré', 'Secteur connu', 'Secteur totalement balisé', 'Niveau inconnu']);

        clickMapType('Danger');
        expect(labels()).toEqual(['Aucun zombie', 'Zombies isolés', 'Meute de zombies', 'Horde de zombies', 'Pas vue aujourd\'hui']);
    });

    it('shows each corner setting in its quarter of the cell, and changes it from the quarter menu', (): void => {
        create();
        fixture.detectChanges();
        const quarter: HTMLButtonElement = fixture.nativeElement.querySelector('.corner-quarter.bottom-left');

        expect(quarter.textContent).toContain('Rien');
        expect(quarter.getAttribute('aria-label')).toBe('Bas gauche : Rien');

        quarter.click();
        fixture.detectChanges();
        const options: HTMLElement[] = Array.from(document.querySelectorAll('.corner-option'));
        const checked: HTMLElement[] = options.filter((option: HTMLElement): boolean => option.getAttribute('aria-checked') === 'true');
        expect(checked.map((option: HTMLElement): string => option.textContent?.trim() ?? '')).toEqual(['Rien']);
        // Les tas du bâtiment sont toujours sur son carré : ils ne sont pas proposés.
        expect(options.some((option: HTMLElement): boolean => !!option.textContent?.includes('Tas du bâtiment'))).toBe(false);

        (options.find((option: HTMLElement): boolean => !!option.textContent?.includes('Objets au sol')) as HTMLElement).click();
        fixture.detectChanges();

        expect(drawMapStub().options()?.corners.digs.bottom_left).toBe('items');
        expect(quarter.textContent).toContain('Objets au sol');
    });

    it('addDistanceToList() adds a new distance option and renders it in the list, ignoring an exact duplicate', async (): Promise<void> => {
        create();
        fixture.detectChanges();

        const testable: {
            new_distance_option: {
                value: number;
                unit: 'km' | 'pa';
                round_trip?: boolean;
            };
            addDistanceToList(): void;
        } = fixture.componentInstance as unknown as typeof testable;
        testable.new_distance_option.value = 5;
        testable.new_distance_option.unit = 'km';
        testable.addDistanceToList();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(1);
        expect(fixture.nativeElement.querySelector('mat-list-item [matListItemTitle]').textContent).toContain('5');

        testable.addDistanceToList();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(1);
    });

    it('removeDistanceFromList() removes a matching distance option from the list', async (): Promise<void> => {
        create();
        fixture.detectChanges();

        const testable: {
            new_distance_option: {
                value: number;
                unit: 'km' | 'pa';
                round_trip?: boolean;
            };
            addDistanceToList(): void;
            removeDistanceFromList(distance: {
                value: number;
                unit: 'km' | 'pa';
                round_trip?: boolean;
            }): void;
        } = fixture.componentInstance as unknown as typeof testable;
        testable.new_distance_option.value = 5;
        testable.new_distance_option.unit = 'km';
        testable.addDistanceToList();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(1);

        testable.removeDistanceFromList({ value: 5, unit: 'km' });
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(0);
    });
});
