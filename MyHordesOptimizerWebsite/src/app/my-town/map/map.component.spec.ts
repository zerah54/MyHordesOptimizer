import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
    ANIMATION_MODULE_TYPE,
    ChangeDetectionStrategy,
    Component,
    DebugElement,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    signal,
    WritableSignal
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';

import { MapRouteDTO, MapRouteRequestDTO } from '../../_abstract_model/dto/map-route.dto';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { Item } from '../../_abstract_model/types/item.class';
import { MapRouteGame } from '../../_abstract_model/types/map-route-game.class';
import { MapRoute, MapRoutePoint } from '../../_abstract_model/types/map-route.class';
import { MapRouteAccess } from '../../_abstract_model/types/map-routes.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { Town } from '../../_abstract_model/types/town.class';
import { TownContextService } from '../../_core/services/town-context.service';
import { setTown } from '../../_core/utilities/localstorage.util';
import { ConfirmDialogComponent } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { DrawMapComponent, MapCellPick } from './draw-map/draw-map.component';
import { DEFAULT_CORNERS } from './map-corners';
import { DayExpeditionsStore } from './map-orders/day-expeditions.store';
import { buildCellOrderIndex, CellOrderIndex } from './map-orders/map-cell-orders';
import { MapOrderBadge } from './map-orders/map-order-badges';
import { MapRouteEditor } from './map-routes/map-route-editor';
import { MapRouteDrawing } from './map-routes/map-route-views';
import { MapRoutesStatus, MapRoutesStore } from './map-routes/map-routes.store';
import { MapComponent, MapOptions } from './map.component';

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
    public readonly routes: InputSignal<readonly MapRouteDrawing[]> = input<readonly MapRouteDrawing[]>([]);
    public readonly orderBadges: InputSignal<readonly MapOrderBadge[]> = input<readonly MapOrderBadge[]>([]);
    public readonly routeEditing: InputSignal<boolean> = input<boolean>(false);
    public readonly cellPicked: OutputEmitterRef<MapCellPick> = output();
    public readonly cellHovered: OutputEmitterRef<MapRoutePoint | null> = output();
    public readonly editedCells: InputSignal<ReadonlySet<string>> = input<ReadonlySet<string>>(new Set<string>());
    public readonly cellCut: OutputEmitterRef<MapRoutePoint> = output();
}

/** Remplace MapRoutesStore : pas de hub SignalR ni d'appel HTTP, des signaux pilotés par le test. */
class MapRoutesStoreStub {
    public readonly map_id: WritableSignal<number | null> = signal(null);
    public readonly status: WritableSignal<MapRoutesStatus> = signal('idle');
    public readonly access: WritableSignal<MapRouteAccess | null> = signal(null);
    public readonly routes: WritableSignal<readonly MapRoute[]> = signal([]);
    public readonly game_routes: WritableSignal<readonly MapRouteGame[]> = signal([]);
    public readonly load: (map_id: number) => void = vi.fn();
    public readonly saveRoute: (request: MapRouteRequestDTO) => Promise<MapRoute> = vi.fn((request: MapRouteRequestDTO): Promise<MapRoute> => {
        return Promise.resolve(newRoute(request.id ?? 7, request.label));
    });
    public readonly deleteRoute: (route_id: number) => Promise<void> = vi.fn((): Promise<void> => Promise.resolve());
    public readonly reloadRoute: (route_id: number) => Promise<MapRoute | null> = vi.fn((): Promise<MapRoute | null> => Promise.resolve(null));
    public readonly copyGameRoute: (game_route_id: number) => Promise<MapRoute> = vi.fn((): Promise<MapRoute> => {
        const copy: MapRoute = newRoute(20, 'Lac');
        this.routes.update((routes: readonly MapRoute[]): readonly MapRoute[] => [...routes, copy]);
        return Promise.resolve(copy);
    });

    public loaded(routes: MapRoute[], access: MapRouteAccess = { is_citizen: true, is_current_town: true, can_create: true }): void {
        this.access.set(access);
        this.routes.set(routes);
        this.status.set('loaded');
    }
}

/** Remplace DayExpeditionsStore : pas de hub ni d'appel HTTP. */
class DayExpeditionsStoreStub {
    public readonly expeditions: WritableSignal<readonly Expedition[]> = signal([]);
    public readonly cell_orders: WritableSignal<CellOrderIndex> = signal(new Map());
    public readonly load: (map_id: number, day: number) => void = vi.fn();

    public loaded(expeditions: Expedition[]): void {
        this.expeditions.set(expeditions);
        this.cell_orders.set(buildCellOrderIndex(expeditions));
    }
}

function newRoute(id: number, label: string): MapRoute {
    const dto: MapRouteDTO = {
        id, label, color: 'teal', authorId: 1, authorName: 'Zerah', isPrivate: false, isEditableByAll: true, sharedUserIds: [],
        cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }], stops: [], length: 1, version: 0, canEdit: true, linkedParts: [], lastUpdateInfo: null
    };
    return new MapRoute(dto);
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
    let routesStore: MapRoutesStoreStub;
    let dayStore: DayExpeditionsStoreStub;

    beforeEach(async (): Promise<void> => {
        localStorage.removeItem('MAP_OPTIONS');
        routesStore = new MapRoutesStoreStub();
        dayStore = new DayExpeditionsStoreStub();

        await TestBed.configureTestingModule({
            imports: [MapComponent],
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MapRoutesStore, useValue: routesStore },
                { provide: DayExpeditionsStore, useValue: dayStore },
                provideRouter([])
            ]
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
        setTown(null);
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

    it('Ctrl + wheel over the map cancels the native browser zoom and zooms the map instead', (): void => {
        create();
        fixture.detectChanges();

        const container: HTMLElement = fixture.nativeElement.querySelector('.map-container');
        const wheel: WheelEvent = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true });
        container.dispatchEvent(wheel);
        fixture.detectChanges();

        expect(wheel.defaultPrevented).toBe(true);
        expect(drawMapStub().zoom()).toBe(34);
    });

    it('a wheel without Ctrl is left to the native scroll', (): void => {
        create();
        fixture.detectChanges();

        const container: HTMLElement = fixture.nativeElement.querySelector('.map-container');
        const wheel: WheelEvent = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
        container.dispatchEvent(wheel);

        expect(wheel.defaultPrevented).toBe(false);
        expect(drawMapStub().zoom()).toBe(30);
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

    /** Bouton de la barre d'outils, repéré par son libellé. */
    function toolbarToggle(label: string): HTMLButtonElement {
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.mho-map-settings-toggle'));
        return buttons.find((button: HTMLButtonElement): boolean => !!button.textContent?.includes(label)) as HTMLButtonElement;
    }

    it('loads the routes of the displayed town', (): void => {
        const town: TownDetails = new TownDetails();
        town.town_id = 4242;
        setTown(town);

        create();
        fixture.detectChanges();

        expect(routesStore.load).toHaveBeenCalledWith(4242);
    });

    describe('observed town', (): void => {
        let context: TownContextService;

        beforeEach((): void => {
            context = TestBed.inject(TownContextService);
            const town: TownDetails = new TownDetails();
            town.town_id = 4242;
            context.setObservedTown(town);
        });

        afterEach((): void => {
            context.clear();
        });

        it('offers no routes to an observer of the town of someone else', (): void => {
            context.setObservedAccess({ is_citizen: false, is_current_town: false, can_create: false });
            create();
            fixture.detectChanges();

            expect(toolbarToggle('Tracés')).toBeUndefined();
            expect(fixture.nativeElement.querySelector('mat-button-toggle[value="routes"]')).toBeNull();
        });

        it('keeps the routes of a former town', (): void => {
            context.setObservedAccess({ is_citizen: true, is_current_town: false, can_create: true });
            create();
            fixture.detectChanges();

            expect(toolbarToggle('Tracés')).toBeDefined();
            expect(routesStore.load).toHaveBeenCalledWith(4242);
        });
    });

    it('the "Tracés" button opens the routes tab, which lists the routes', async (): Promise<void> => {
        create();
        fixture.detectChanges();
        routesStore.loaded([newRoute(1, 'Nord-Est')]);

        toolbarToggle('Tracés').click();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(toolbarToggle('Tracés').getAttribute('aria-pressed')).toBe('true');
        expect(fixture.nativeElement.querySelector('mho-map-routes-panel .route-name')?.textContent).toContain('Nord-Est');
        expect(drawMapStub().routes().map((drawing: MapRouteDrawing): string => drawing.key)).toEqual(['mho-1']);
    });

    it('the side panel shows a title instead of tabs duplicating the toolbar buttons', async (): Promise<void> => {
        create();
        fixture.detectChanges();
        const title = (): string | undefined => fixture.nativeElement.querySelector('.settings-header .side-panel-title')?.textContent?.trim();

        expect(fixture.nativeElement.querySelector('.side-panel-tabs')).toBeNull();
        expect(title()).toBe('Affichage');

        toolbarToggle('Tracés').click();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(title()).toBe('Tracés');
    });

    it('hiding a route removes it from the map and persists the setting', async (): Promise<void> => {
        create();
        fixture.detectChanges();
        routesStore.loaded([newRoute(1, 'Nord-Est'), newRoute(2, 'Sud')]);
        toolbarToggle('Tracés').click();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('mho-map-routes-panel .eye') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(drawMapStub().routes().map((drawing: MapRouteDrawing): string => drawing.key)).toEqual(['mho-2']);
        const stored: MapOptions = JSON.parse(localStorage.getItem('MAP_OPTIONS') as string);
        expect(stored.routes.hidden).toEqual(['mho-1']);
    });

    it('a zoom step does not hand the routes layer new drawings', (): void => {
        create();
        fixture.detectChanges();
        routesStore.loaded([newRoute(1, 'Nord-Est')]);
        fixture.detectChanges();
        const before: readonly MapRouteDrawing[] = drawMapStub().routes();

        zoomButton('zoom_in').click();
        fixture.detectChanges();

        expect(drawMapStub().zoom()).toBeGreaterThan(30);
        expect(drawMapStub().routes()).toBe(before);
    });

    it('drops the settings of routes that no longer exist once its own town is loaded', (): void => {
        localStorage.setItem('MAP_OPTIONS', JSON.stringify({ routes: { hidden: ['mho-1', 'mho-9', 'bad'], colors: { 'mho-9': 'pink' }, show_previous_days: true } }));
        create();
        fixture.detectChanges();

        routesStore.loaded([newRoute(1, 'Nord-Est')]);
        fixture.detectChanges();

        const stored: MapOptions = JSON.parse(localStorage.getItem('MAP_OPTIONS') as string);
        expect(stored.routes).toEqual({ hidden: ['mho-1'], colors: {}, show_previous_days: true });
    });

    it('keeps the settings when an observed town is loaded', (): void => {
        localStorage.setItem('MAP_OPTIONS', JSON.stringify({ routes: { hidden: ['mho-9'], colors: {}, show_previous_days: false } }));
        create();
        fixture.detectChanges();

        routesStore.loaded([newRoute(1, 'Nord-Est')], { is_citizen: true, is_current_town: false, can_create: true });
        fixture.detectChanges();

        expect(drawMapStub().routes().length).toBe(1);
        expect(localStorage.getItem('MAP_OPTIONS')).toContain('mho-9');
    });

    describe('route input', (): void => {
        /** Carte 3 × 3, ville au centre (1, 1). */
        function townWithCells(): Town {
            const town: Town = new Town();
            town.town_x = 1;
            town.town_y = 1;
            town.map_width = 3;
            town.map_height = 3;
            town.day = 4;
            town.cells = [];
            return town;
        }

        async function openRoutesPanel(is_gt_xs: boolean = true): Promise<void> {
            create(is_gt_xs);
            (townService.getMap as Mock).mockReturnValue(of(townWithCells()));
            fixture = TestBed.createComponent(MapComponent);
            fixture.detectChanges();
            routesStore.loaded([newRoute(1, 'Nord-Est')]);
            toolbarToggle('Tracés').click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
        }

        function button(root: Element, label: string): HTMLButtonElement {
            const buttons: HTMLButtonElement[] = Array.from(root.querySelectorAll('button'));
            return buttons.find((candidate: HTMLButtonElement): boolean => !!candidate.textContent?.includes(label)) as HTMLButtonElement;
        }

        function drawingKeys(): string[] {
            return drawMapStub().routes().map((drawing: MapRouteDrawing): string => drawing.key);
        }

        async function startNewRoute(is_gt_xs: boolean = true): Promise<void> {
            await openRoutesPanel(is_gt_xs);
            button(fixture.nativeElement.querySelector('mho-map-routes-panel'), 'Nouveau tracé').click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
        }

        function pick(x: number, y: number): void {
            drawMapStub().cellPicked.emit({ x, y, touch: false });
            fixture.detectChanges();
        }

        it('turns the map into route input: clicks add destinations, the other routes fade, Escape undoes', async (): Promise<void> => {
            await startNewRoute();

            expect(drawMapStub().routeEditing()).toBe(true);
            expect(fixture.nativeElement.querySelector('mho-map-route-editor')).not.toBeNull();
            expect(fixture.nativeElement.querySelector('.route-edit-banner')).not.toBeNull();

            pick(1, 1);
            pick(2, 1);
            pick(2, 0);

            expect(drawingKeys()).toEqual(['mho-1', 'draft']);
            expect(drawMapStub().routes()[0].dimmed).toBe(true);
            expect(drawMapStub().routes()[1].cells).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }]);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            fixture.detectChanges();

            expect(drawMapStub().routes()[1].cells).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
        });

        it('cuts the route from a right-click, and Escape brings the cut part back', async (): Promise<void> => {
            await startNewRoute();
            pick(1, 1);
            pick(2, 1);
            pick(2, 0);
            expect([...drawMapStub().editedCells()]).toEqual(['1,1', '2,1', '2,0']);

            drawMapStub().cellCut.emit({ x: 2, y: 1 });
            fixture.detectChanges();

            expect(drawMapStub().routes()[1].cells).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }]);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            fixture.detectChanges();

            expect(drawMapStub().routes()[1].cells).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }]);
        });

        it('previews the segment under the mouse', async (): Promise<void> => {
            await startNewRoute();
            pick(1, 1);

            drawMapStub().cellHovered.emit({ x: 0, y: 0 });
            fixture.detectChanges();

            expect(drawingKeys()).toEqual(['mho-1', 'draft', 'preview']);
        });

        it('lets the editor span the full panel width, then restores the panel padding', async (): Promise<void> => {
            await startNewRoute();
            const body: HTMLElement = fixture.nativeElement.querySelector('.settings-body');

            expect(body.classList).toContain('flush');

            fixture.debugElement.injector.get(MapRouteEditor).cancel();
            fixture.detectChanges();

            expect(body.classList).not.toContain('flush');
        });

        it('saves the route, then shows its card', async (): Promise<void> => {
            await startNewRoute();
            pick(1, 1);
            pick(2, 1);
            const name: HTMLInputElement = fixture.nativeElement.querySelector('mho-map-route-editor input');
            name.value = 'Est';
            name.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            button(fixture.nativeElement.querySelector('mho-map-route-editor .editor-footer'), 'Enregistrer').click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();

            expect(routesStore.saveRoute).toHaveBeenCalledWith(expect.objectContaining({ id: null, label: 'Est' }));
            expect(drawMapStub().routeEditing()).toBe(false);
            expect(fixture.nativeElement.querySelector('mho-map-routes-panel')).not.toBeNull();
        });

        it('on a phone, closes the panel while drawing and reopens it from the banner', async (): Promise<void> => {
            await startNewRoute(false);

            expect(fixture.nativeElement.querySelector('mat-sidenav').classList).not.toContain('mat-drawer-opened');

            button(fixture.nativeElement.querySelector('.route-edit-banner'), 'Terminer').click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('mho-map-route-editor')).not.toBeNull();
            expect(button(fixture.nativeElement.querySelector('.route-edit-banner'), 'Terminer')).toBeUndefined();
        });

        it('deletes a route after confirmation', async (): Promise<void> => {
            const ref: Pick<MatDialogRef<ConfirmDialogComponent, boolean>, 'afterClosed'> = { afterClosed: (): Observable<boolean> => of(true) };
            const open: Mock = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(<MatDialogRef<ConfirmDialogComponent, boolean>>ref);
            await openRoutesPanel();
            (fixture.nativeElement.querySelector('mho-map-routes-panel .route-main') as HTMLButtonElement).click();
            fixture.detectChanges();

            button(fixture.nativeElement.querySelector('mho-map-routes-panel .detail-actions'), 'Supprimer').click();
            await vi.advanceTimersByTimeAsync(0);

            expect(open).toHaveBeenCalled();
            expect(routesStore.deleteRoute).toHaveBeenCalledWith(1);
        });
    });

    it('copies a game route into MHO and opens the card of the copy', async (): Promise<void> => {
        create();
        fixture.detectChanges();
        routesStore.game_routes.set([new MapRouteGame({ id: 2, authorId: 6, label: 'Lac', length: 2, stops: [{ x: 0, y: 0 }, { x: 0, y: 1 }] })]);
        routesStore.loaded([]);
        toolbarToggle('Tracés').click();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();
        (fixture.nativeElement.querySelector('mho-map-routes-panel .route-main') as HTMLButtonElement).click();
        fixture.detectChanges();

        const copy: HTMLButtonElement = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('mho-map-routes-panel .detail-actions button'))
            .find((button: HTMLButtonElement): boolean => !!button.textContent?.includes('Copier dans MHO')) as HTMLButtonElement;
        copy.click();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(routesStore.copyGameRoute).toHaveBeenCalledWith(2);
        expect(drawMapStub().routes().find((drawing: MapRouteDrawing): boolean => drawing.key === 'mho-20')?.emphasized).toBe(true);
    });

    describe('orders of the day', (): void => {
        function townOfDay(): Town {
            const town: Town = newTown();
            town.day = 4;
            return town;
        }

        function createWithMap(): void {
            create();
            (townService.getMap as Mock).mockReturnValue(of(townOfDay()));
            fixture = TestBed.createComponent(MapComponent);
            fixture.detectChanges();
        }

        /** Expédition dont l'unique partie suit le tracé `route_id` (ou aucun) et porte une consigne en (0, 1). */
        function expedition(route_id: number | null): Expedition {
            const order: ExpeditionOrder = new ExpeditionOrder({ id: 9, type: 'checkbox', text: '', isDone: false, position: 0, x: 0, y: 1, kind: 'camp' });
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), {
                id: 2, position: 0, citizens: [], orders: [order], map_route_id: route_id,
                map_route: route_id === null ? null : { id: route_id, label: 'Nord-Est', color: 'teal', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }], length: 1, version: 0 }
            });
            return Object.assign(new Expedition(), { id: 1, label: 'Expé', position: 0, parts: [part] });
        }

        it('loads the expeditions of the day once the user is known as a citizen', (): void => {
            createWithMap();
            expect(dayStore.load).not.toHaveBeenCalled();

            routesStore.map_id.set(42);
            routesStore.loaded([]);
            fixture.detectChanges();

            expect(dayStore.load).toHaveBeenCalledWith(42, 4);
        });

        it('loads nothing for an observer', (): void => {
            createWithMap();
            routesStore.map_id.set(42);
            routesStore.loaded([], { is_citizen: false, is_current_town: false, can_create: false });
            fixture.detectChanges();

            expect(dayStore.load).not.toHaveBeenCalled();
        });

        it('puts a badge of the route color on the cells with orders, hidden with the route', async (): Promise<void> => {
            createWithMap();
            routesStore.loaded([newRoute(1, 'Nord-Est')]);
            dayStore.loaded([expedition(1)]);
            fixture.detectChanges();

            expect(drawMapStub().orderBadges()).toEqual([
                expect.objectContaining({ cell: { x: 0, y: 1 }, color: 'teal', count: 1, dimmed: false })
            ]);

            toolbarToggle('Tracés').click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            (fixture.nativeElement.querySelector('mho-map-routes-panel .eye') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(drawMapStub().orderBadges()).toEqual([]);
        });

        it('puts a neutral badge for the orders of a part without route', (): void => {
            createWithMap();
            routesStore.loaded([]);
            dayStore.loaded([expedition(null)]);
            fixture.detectChanges();

            expect(drawMapStub().orderBadges()).toEqual([expect.objectContaining({ color: null, lane: 0, count: 1 })]);
        });

        it('counts the orders of the day in the card of a linked route', async (): Promise<void> => {
            createWithMap();
            routesStore.loaded([newRoute(1, 'Nord-Est')]);
            dayStore.loaded([expedition(1)]);
            toolbarToggle('Tracés').click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();

            (fixture.nativeElement.querySelector('mho-map-routes-panel .route-main') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('mho-map-routes-panel .detail-fields').textContent).toContain('1 consigne(s) sur 1 case(s)');
        });
    });

    describe('link from the expeditions page', (): void => {
        /** Ouvre la carte sur `/?route=<query>` ; renvoie l'espion de la navigation qui retire le paramètre. */
        async function openWith(query: string, is_gt_xs: boolean = true): Promise<Mock> {
            const router: Router = TestBed.inject(Router);
            vi.useRealTimers();
            await router.navigateByUrl(`/?route=${query}`);
            vi.useFakeTimers();
            create(is_gt_xs);
            (townService.getMap as Mock).mockReturnValue(of(newTown()));
            const navigate: Mock = vi.spyOn(router, 'navigate').mockResolvedValue(true);
            fixture = TestBed.createComponent(MapComponent);
            fixture.detectChanges();
            return navigate;
        }

        async function loadRoutes(routes: MapRoute[], access?: MapRouteAccess): Promise<void> {
            routesStore.loaded(routes, access);
            fixture.detectChanges();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
        }

        function sidenavOpened(): boolean {
            return fixture.nativeElement.querySelector('mat-sidenav').classList.contains('mat-drawer-opened');
        }

        function expectParamRemoved(navigate: Mock): void {
            expect(navigate).toHaveBeenCalledTimes(1);
            expect(navigate).toHaveBeenCalledWith([], {
                relativeTo: TestBed.inject(ActivatedRoute), queryParams: { route: null }, queryParamsHandling: 'merge', replaceUrl: true
            });
        }

        it('waits for the routes, then opens the card of the linked route once', async (): Promise<void> => {
            const navigate: Mock = await openWith('2');
            expect(navigate).not.toHaveBeenCalled();
            expect(sidenavOpened()).toBe(false);

            await loadRoutes([newRoute(1, 'Nord-Est'), newRoute(2, 'Sud')]);

            expect(sidenavOpened()).toBe(true);
            expect(fixture.nativeElement.querySelector('mho-map-routes-panel .detail-actions')).not.toBeNull();
            expectParamRemoved(navigate);

            routesStore.routes.set([newRoute(1, 'Nord-Est'), newRoute(2, 'Sud'), newRoute(3, 'Ouest')]);
            fixture.detectChanges();
            expect(navigate).toHaveBeenCalledTimes(1);
        });

        it('shows the linked route when it was hidden', async (): Promise<void> => {
            localStorage.setItem('MAP_OPTIONS', JSON.stringify({ routes: { hidden: ['mho-2'], colors: {}, show_previous_days: false } }));
            await openWith('2');

            await loadRoutes([newRoute(1, 'Nord-Est'), newRoute(2, 'Sud')]);

            expect(drawMapStub().routes().map((drawing: MapRouteDrawing): string => drawing.key)).toContain('mho-2');
            expect(JSON.parse(localStorage.getItem('MAP_OPTIONS') as string).routes.hidden).toEqual([]);
        });

        it('ignores a route that is not visible, but still cleans the address', async (): Promise<void> => {
            const navigate: Mock = await openWith('9');

            await loadRoutes([newRoute(1, 'Nord-Est')]);

            expect(sidenavOpened()).toBe(false);
            expectParamRemoved(navigate);
        });

        it('starts drawing a new route when the user may create one', async (): Promise<void> => {
            const navigate: Mock = await openWith('new');

            await loadRoutes([newRoute(1, 'Nord-Est')]);

            expect(drawMapStub().routeEditing()).toBe(true);
            expect(fixture.nativeElement.querySelector('mho-map-route-editor')).not.toBeNull();
            expectParamRemoved(navigate);
        });

        it('does not start drawing without the right to create a route', async (): Promise<void> => {
            await openWith('new');

            await loadRoutes([newRoute(1, 'Nord-Est')], { is_citizen: false, is_current_town: false, can_create: false });

            expect(drawMapStub().routeEditing()).toBe(false);
            expect(sidenavOpened()).toBe(false);
        });

        it('on a phone, keeps the panel closed over the map', async (): Promise<void> => {
            await openWith('2', false);

            await loadRoutes([newRoute(1, 'Nord-Est'), newRoute(2, 'Sud')]);

            expect(sidenavOpened()).toBe(false);
        });
    });
});
