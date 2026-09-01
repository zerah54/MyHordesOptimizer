import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Me } from '../../../_abstract_model/types/me.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { setUser } from '../../../_core/utilities/localstorage.util';
import { MapOptions } from '../map.component';
import { DrawMapComponent } from './draw-map.component';
import { MapCellComponent } from './map-cell/map-cell.component';

interface TestableComponent {
    complete_map: { (): Town | undefined };
    my_cell: { (): Cell | undefined };
    drawed_map: { (): Cell[][] };
    x_row: { (): number[] };
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
    distances: []
};

describe('DrawMapComponent', (): void => {
    let fixture: ComponentFixture<DrawMapComponent>;
    let testable: TestableComponent;

    beforeEach(async (): Promise<void> => {
        setUser(null);
        await TestBed.configureTestingModule({
            imports: [DrawMapComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();
        fixture = TestBed.createComponent(DrawMapComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.componentRef.setInput('allRuins', <Ruin[]>[]);
        fixture.componentRef.setInput('allItems', <Item[]>[]);
        fixture.componentRef.setInput('allCitizens', <Citizen[]>[]);
        fixture.componentRef.setInput('options', options);
    });

    afterEach((): void => setUser(null));

    it('renders nothing while the map is not yet available', (): void => {
        fixture.componentRef.setInput('map', undefined);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table.mho-draw-map')).toBeNull();
    });

    it('renders the table once the map is set', (): void => {
        fixture.componentRef.setInput('map', newTown());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table.mho-draw-map')).not.toBeNull();
        expect(testable.complete_map()?.map_width).toBe(5);
    });

    it('builds x_row from map_width/town_x and renders that many horizontal borders in the header row', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 2, map_width: 5 }));
        fixture.detectChanges();

        expect(testable.x_row()).toEqual([-2, -1, 0, 1, 2]);
        const headerBorders: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('thead .border-cell.horizontal:not(.vertical)'));
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

        const leftBorder: HTMLElement = fixture.nativeElement.querySelector('tbody tr mho-map-border .border-cell');
        expect(leftBorder.classList.contains('hovered')).toBe(false);

        const cellTd: HTMLElement = fixture.nativeElement.querySelector('tbody mho-map-cell td');
        cellTd.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();

        expect(leftBorder.classList.contains('hovered')).toBe(true);
    });

    it('replaces the cell in place in drawed_map on the map-cell cellChange event, and re-renders it', (): void => {
        const original: Cell = newCell(0, 0, { nb_zombie: 1 });
        fixture.componentRef.setInput('map', newTown({ town_x: 0, map_width: 1, cells: [original] }));
        fixture.detectChanges();

        const replacement: Cell = newCell(0, 0, { nb_zombie: 9 });
        fixture.debugElement.query(By.directive(MapCellComponent)).triggerEventHandler('cellChange', replacement);
        fixture.detectChanges();

        expect(testable.drawed_map()[0][0]).toBe(replacement);
        const rebound: MapCellComponent = fixture.debugElement.query(By.directive(MapCellComponent)).componentInstance;
        expect(rebound.cell()).toBe(replacement);
    });

    it('recomputes the map when a new map is bound', (): void => {
        fixture.componentRef.setInput('map', newTown({ town_x: 2, map_width: 5 }));
        fixture.detectChanges();
        expect(testable.x_row().length).toBe(5);

        fixture.componentRef.setInput('map', newTown({ town_x: 1, map_width: 3 }));
        fixture.detectChanges();

        expect(testable.x_row()).toEqual([-1, 0, 1]);
    });
});
