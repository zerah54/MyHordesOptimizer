import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Me } from '../../../_abstract_model/types/me.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { setUser } from '../../../_core/utilities/localstorage.util';
import { MapOptions } from '../map.component';
import { CORNERS_VERSION, sanitizeCorners } from '../map-corners';
import { provideMapOrdersTesting } from '../map-orders/map-orders.testing';
import { DEFAULT_ROUTES_DISPLAY } from '../map-routes/map-routes-display';
import { DrawMapComponent, MapCellPick } from './draw-map.component';
import { MapCellComponent } from './map-cell/map-cell.component';
import { MapCellDetailsComponent } from './map-cell-details/map-cell-details.component';
import { MapRoutesLayerComponent } from './map-routes-layer/map-routes-layer.component';
import { MapUpdateComponent } from './map-update/map-update.component';

interface TestableComponent {
    complete_map: {
        (): Town | undefined;
    };
    my_cell: {
        (): Cell | undefined;
    };
    drawed_map: {
        (): Cell[][];
    };
    x_row: {
        (): number[];
    };
}

function newTown(overrides: Partial<Town> = {}): Town {
    const town: Town = new Town();
    town.town_x = 2;
    town.town_y = 3;
    town.map_width = 5;
    town.cells = [];
    Object.assign(town, overrides);
    return town;
}

function newCell(x: number, y: number, overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    cell.cell_id = y * 1000 + x;
    cell.x = x;
    cell.y = y;
    cell.citizens = [];
    Object.assign(cell, overrides);
    return cell;
}

const options: MapOptions = {
    map_type: 'digs',
    dig_mode: 'average',
    trash_mode: 'nb',
    displayed_scrut_zone: {},
    distances: [],
    zoom: 30,
    corners: sanitizeCorners(undefined),
    corners_version: CORNERS_VERSION,
    routes: DEFAULT_ROUTES_DISPLAY
};

describe('DrawMapComponent', (): void => {
    let fixture: ComponentFixture<DrawMapComponent>;
    let testable: TestableComponent;

    beforeEach(async (): Promise<void> => {
        setUser(null);
        await TestBed.configureTestingModule({
            imports: [DrawMapComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                ...provideMapOrdersTesting()
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(DrawMapComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.componentRef.setInput('allRuins', <Ruin[]>[]);
        fixture.componentRef.setInput('allItems', <Item[]>[]);
        fixture.componentRef.setInput('allCitizens', <Citizen[]>[]);
        fixture.componentRef.setInput('options', options);
        fixture.componentRef.setInput('zoom', options.zoom);
    });

    afterEach((): void => {
        setUser(null);
        TestBed.inject(TownContextService).clear();
    });

    /** Choisit la première case rendue, comme le ferait un clic. */
    function clickFirstCell(): void {
        fixture.nativeElement.querySelector('.map-row:not(.axis-row) mho-map-cell .map-cell').dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
    }

    it('renders nothing while the map is not yet available', (): void => {
        fixture.componentRef.setInput('map', undefined);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-draw-map')).toBeNull();
    });

    it('renders the grid once the map is set', (): void => {
        fixture.componentRef.setInput('map', newTown());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-draw-map')).not.toBeNull();
        expect(testable.complete_map()?.map_width).toBe(5);
    });

    it('builds x_row from map_width/town_x and renders that many horizontal borders in the header row', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 2, map_width: 5 }));
        fixture.detectChanges();

        expect(testable.x_row()).toEqual([-2, -1, 0, 1, 2]);
        const headerBorders: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.axis-row.top .border-cell.horizontal:not(.vertical)'));
        expect(headerBorders.length).toBe(5);
        expect(headerBorders.map((el: HTMLElement): string => el.textContent?.trim() ?? '')).toEqual(['-2', '-1', '0', '1', '2']);
    });

    it('groups and sorts the cells into rows by y then x', (): void => {
        const town: Town = newTown({
            cells: [
                newCell(1, 0),
                newCell(0, 0),
                newCell(0, 1),
                newCell(1, 1)
            ]
        });
        fixture.componentRef.setInput('map', town);
        fixture.detectChanges();

        const drawed_map: Cell[][] = testable.drawed_map();
        expect(drawed_map.length).toBe(2);
        expect(drawed_map[0].map((cell: Cell): number => cell.x)).toEqual([0, 1]);
        expect(drawed_map[0][0].y).toBe(0);
        expect(drawed_map[1].map((cell: Cell): number => cell.x)).toEqual([0, 1]);
        expect(drawed_map[1][0].y).toBe(1);
    });

    it('selects my_cell as the cell whose citizens include the current user', (): void => {
        setUser(Object.assign(new Me(), { id: 42 }));
        const me: Citizen = new Citizen();
        me.id = 42;
        me.name = 'Me';
        const otherCell: Cell = newCell(0, 0);
        const myCellFixture: Cell = newCell(1, 0, { citizens: [me] });
        fixture.componentRef.setInput('map', newTown({ cells: [otherCell, myCellFixture] }));
        fixture.detectChanges();

        expect(testable.my_cell()).toBe(myCellFixture);
    });

    it('leaves my_cell undefined when no cell contains the current user', (): void => {
        setUser(Object.assign(new Me(), { id: 42 }));
        fixture.componentRef.setInput('map', newTown({ cells: [newCell(0, 0)] }));
        fixture.detectChanges();

        expect(testable.my_cell()).toBeUndefined();
    });

    it('propagates a hovered cell from a map-cell mouseenter down to the matching map-border (parent/child wiring)', (): void => {
        const hoveredCell: Cell = newCell(0, 0, { displayed_x: 0, displayed_y: 3 });
        fixture.componentRef.setInput('map', newTown({ town_x: 2, town_y: 3, map_width: 1, cells: [hoveredCell] }));
        fixture.detectChanges();

        const leftBorder: HTMLElement = fixture.nativeElement.querySelector('.map-row:not(.axis-row) mho-map-border .border-cell');
        expect(leftBorder.classList.contains('hovered')).toBe(false);

        const cell_element: HTMLElement = fixture.nativeElement.querySelector('.map-row:not(.axis-row) mho-map-cell .map-cell');
        cell_element.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();

        expect(leftBorder.classList.contains('hovered')).toBe(true);
    });

    it('opens the detail panel on the chosen cell, and marks its coordinates on the axes', (): void => {
        const cell: Cell = newCell(0, 0, { displayed_x: 0, displayed_y: 3 });
        fixture.componentRef.setInput('map', newTown({ town_x: 2, town_y: 3, map_width: 1, cells: [cell] }));
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).toBeNull();

        clickFirstCell();

        const details: MapCellDetailsComponent = fixture.debugElement.query(By.directive(MapCellDetailsComponent)).componentInstance;
        expect(details.cell()).toBe(cell);
        expect(fixture.nativeElement.querySelector('.map-cell').classList).toContain('selected');
        expect(fixture.nativeElement.querySelector('.map-row:not(.axis-row) .border-cell').classList).toContain('selected');
    });

    it('closes the detail panel when the chosen cell is clicked again', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.detectChanges();

        clickFirstCell();
        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).not.toBeNull();

        clickFirstCell();
        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).toBeNull();
    });

    it('closes the detail panel on its close event', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.detectChanges();
        clickFirstCell();

        fixture.debugElement.query(By.directive(MapCellDetailsComponent)).triggerEventHandler('closed', undefined);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).toBeNull();
    });

    it('replaces the chosen cell in drawed_map with the update dialog result, and re-renders it', (): void => {
        const original: Cell = newCell(0, 0, { nb_zombie: 1 });
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [original] }));
        fixture.detectChanges();
        clickFirstCell();

        const dialog: MatDialog = TestBed.inject(MatDialog);
        const replacement: Cell = newCell(0, 0, { nb_zombie: 9 });
        vi.spyOn(dialog, 'open').mockReturnValue(<never>{ afterClosed: () => of(replacement) });

        fixture.debugElement.query(By.directive(MapCellDetailsComponent)).triggerEventHandler('updateRequested', undefined);
        fixture.detectChanges();

        expect(dialog.open).toHaveBeenCalledWith(MapUpdateComponent, expect.objectContaining({
            data: expect.objectContaining({ cell: original })
        }));
        expect(testable.drawed_map()[0][0]).toBe(replacement);
        const rebound: MapCellComponent = fixture.debugElement.query(By.directive(MapCellComponent)).componentInstance;
        expect(rebound.cell()).toBe(replacement);
    });

    it('leaves drawed_map alone when the update dialog closes without a result', (): void => {
        const original: Cell = newCell(0, 0, { nb_zombie: 1 });
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [original] }));
        fixture.detectChanges();
        clickFirstCell();

        const dialog: MatDialog = TestBed.inject(MatDialog);
        vi.spyOn(dialog, 'open').mockReturnValue(<never>{ afterClosed: () => of(undefined) });

        fixture.debugElement.query(By.directive(MapCellDetailsComponent)).triggerEventHandler('updateRequested', undefined);
        fixture.detectChanges();

        expect(testable.drawed_map()[0][0]).toBe(original);
    });

    it('hides the update action and never opens the dialog when the town is observed in readonly mode', (): void => {
        TestBed.inject(TownContextService).setObservedTown(new TownDetails());
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.detectChanges();
        clickFirstCell();

        const details: MapCellDetailsComponent = fixture.debugElement.query(By.directive(MapCellDetailsComponent)).componentInstance;
        expect(details.canUpdate()).toBe(false);
        expect(details.canEditOrders()).toBe(false);

        const dialog: MatDialog = TestBed.inject(MatDialog);
        vi.spyOn(dialog, 'open');
        fixture.debugElement.query(By.directive(MapCellDetailsComponent)).triggerEventHandler('updateRequested', undefined);

        expect(dialog.open).not.toHaveBeenCalled();
    });

    it('lets a former citizen edit the orders of an observed cell, not the cell itself', (): void => {
        const context: TownContextService = TestBed.inject(TownContextService);
        context.setObservedTown(new TownDetails());
        context.setObservedAccess({ is_citizen: true, is_current_town: false, can_create: true });
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.detectChanges();
        clickFirstCell();

        const details: MapCellDetailsComponent = fixture.debugElement.query(By.directive(MapCellDetailsComponent)).componentInstance;
        expect(details.canUpdate()).toBe(false);
        expect(details.canEditOrders()).toBe(true);
    });

    it('drops the chosen cell when a new map is bound', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.detectChanges();
        clickFirstCell();
        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).not.toBeNull();

        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0, { cell_id: 99 })] }));
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).toBeNull();
    });

    it('recomputes the map when a new map is bound', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 2, map_width: 5 }));
        fixture.detectChanges();
        expect(testable.x_row().length).toBe(5);

        fixture.componentRef.setInput('map', newTown({ town_x: 1, map_width: 3 }));
        fixture.detectChanges();

        expect(testable.x_row()).toEqual([-1, 0, 1]);
    });

    it('draws the routes layer over the grid, sized in cells, only when there are routes', (): void => {
        fixture.componentRef.setInput('map', newTown({ map_width: 2, cells: [newCell(0, 0), newCell(1, 0), newCell(0, 1), newCell(1, 1)] }));
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.directive(MapRoutesLayerComponent))).toBeNull();

        fixture.componentRef.setInput('routes', [{
            key: 'mho-1', color: 'teal', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }], lane: 0, dashed: false, emphasized: false, dimmed: false, end: { x: 1, y: 0 },
            label: null
        }]);
        fixture.detectChanges();

        const layer: MapRoutesLayerComponent = fixture.debugElement.query(By.directive(MapRoutesLayerComponent)).componentInstance;
        expect(layer.width()).toBe(2);
        expect(layer.height()).toBe(2);
        expect(layer.drawings().length).toBe(1);
    });

    it('in route mode, reports the clicked and hovered cells instead of opening the detail', (): void => {
        const picks: MapCellPick[] = [];
        const hovers: (MapRoutePoint | null)[] = [];
        fixture.componentInstance.cellPicked.subscribe((pick: MapCellPick): void => {
            picks.push(pick);
        });
        fixture.componentInstance.cellHovered.subscribe((point: MapRoutePoint | null): void => {
            hovers.push(point);
        });
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.componentRef.setInput('routeEditing', true);
        fixture.detectChanges();
        const cell: HTMLElement = fixture.nativeElement.querySelector('.map-row:not(.axis-row) mho-map-cell .map-cell');

        cell.dispatchEvent(new MouseEvent('mouseenter'));
        clickFirstCell();
        cell.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' }));
        clickFirstCell();
        cell.dispatchEvent(new MouseEvent('mouseleave'));

        expect(picks).toEqual([{ x: 0, y: 0, touch: false }, { x: 0, y: 0, touch: true }]);
        expect(hovers).toEqual([{ x: 0, y: 0 }, null]);
        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).toBeNull();
        expect(fixture.nativeElement.querySelector('.mho-draw-map').classList).toContain('route-editing');
    });

    it('closes the open detail when route mode starts', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [newCell(0, 0)] }));
        fixture.detectChanges();
        clickFirstCell();
        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).not.toBeNull();

        fixture.componentRef.setInput('routeEditing', true);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(MapCellDetailsComponent))).toBeNull();
    });

    describe('cutting the route being drawn', (): void => {
        let cuts: MapRoutePoint[];
        let picks: MapCellPick[];

        beforeEach((): void => {
            cuts = [];
            picks = [];
            fixture.componentInstance.cellCut.subscribe((point: MapRoutePoint): void => {
                cuts.push(point);
            });
            fixture.componentInstance.cellPicked.subscribe((pick: MapCellPick): void => {
                picks.push(pick);
            });
            fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 2, cells: [newCell(0, 0), newCell(1, 0)] }));
            fixture.componentRef.setInput('routeEditing', true);
            fixture.componentRef.setInput('editedCells', new Set<string>(['0,0']));
            fixture.detectChanges();
        });

        afterEach((): void => {
            vi.useRealTimers();
        });

        function cellElement(index: number): HTMLElement {
            return fixture.nativeElement.querySelectorAll('.map-row:not(.axis-row) mho-map-cell .map-cell')[index];
        }

        function rightClick(index: number): MouseEvent {
            const event: MouseEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            cellElement(index).dispatchEvent(event);
            return event;
        }

        function touch(type: string, index: number, client_x: number = 0): void {
            cellElement(index).dispatchEvent(Object.assign(new Event(type, { bubbles: true }), {
                pointerType: 'touch', pointerId: 1, clientX: client_x, clientY: 0
            }));
        }

        it('cuts on a right-click on the route, without the browser menu', (): void => {
            const event: MouseEvent = rightClick(0);

            expect(cuts).toEqual([{ x: 0, y: 0 }]);
            expect(event.defaultPrevented).toBe(true);
        });

        it('keeps the browser menu off the route, and outside route input', (): void => {
            expect(rightClick(1).defaultPrevented).toBe(false);

            fixture.componentRef.setInput('routeEditing', false);
            fixture.detectChanges();

            expect(rightClick(0).defaultPrevented).toBe(false);
            expect(cuts).toEqual([]);
        });

        it('cuts on a long touch, and the release does not add a destination', (): void => {
            vi.useFakeTimers();
            touch('pointerdown', 0);
            vi.advanceTimersByTime(499);
            expect(cuts).toEqual([]);

            vi.advanceTimersByTime(1);
            expect(cuts).toEqual([{ x: 0, y: 0 }]);

            cellElement(0).dispatchEvent(new MouseEvent('click'));
            expect(picks).toEqual([]);

            touch('pointerdown', 0);
            touch('pointerup', 0);
            cellElement(0).dispatchEvent(new MouseEvent('click'));
            expect(picks).toEqual([{ x: 0, y: 0, touch: true }]);
            expect(cuts.length).toBe(1);
        });

        it('cancels the long touch when the finger moves, and ignores cells off the route', (): void => {
            vi.useFakeTimers();
            touch('pointerdown', 0);
            touch('pointermove', 0, 20);
            touch('pointerdown', 1);
            vi.advanceTimersByTime(1000);

            expect(cuts).toEqual([]);
        });
    });
});
