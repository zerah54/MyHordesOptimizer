import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { TownDetails } from '../../../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../../../_core/services/town-context.service';
import { MapOptions } from '../../map.component';
import { MapUpdateComponent } from '../map-update/map-update.component';
import { MapCellComponent } from './map-cell.component';

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    Object.assign(cell, {
        cell_id: 1,
        x: 0,
        y: 0,
        displayed_x: 0,
        displayed_y: 0,
        is_town: false,
        is_never_visited: false,
        is_visited_today: false,
        danger_level: 0,
        ruin_id: 0,
        is_dryed: false,
        nb_zombie: 0,
        nb_zombie_killed: 0,
        nb_hero: 0,
        is_ruin_dryed: false,
        nb_ruin_dig: 0,
        total_success: 0,
        average_potential_remaining_dig: 0,
        max_potential_remaining_dig: 0,
        items: [],
        citizens: [],
        nb_pa: 0,
        nb_km: 0,
        zone_regen: undefined,
        note: '',
        scav_zone_level: null,
        scout_zone_level: null,
        scout_estimation_zombie: null,
        scout_estimation_min: null,
        scout_estimation_max: null,
        scout_estimation_update_info: null
    });
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

describe('MapCellComponent', (): void => {
    let fixture: ComponentFixture<MapCellComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MapCellComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(MapCellComponent);
    });

    afterEach((): void => TestBed.inject(TownContextService).clear());

    function setInputs(cell: Cell, opts: MapOptions = options): void {
        fixture.componentRef.setInput('cell', cell);
        fixture.componentRef.setInput('drawedMap', [[cell]]);
        fixture.componentRef.setInput('allRuins', <Ruin[]>[]);
        fixture.componentRef.setInput('allCitizens', <Citizen[]>[]);
        fixture.componentRef.setInput('allItems', <Item[]>[]);
        fixture.componentRef.setInput('options', opts);
    }

    it('applies the "danger" class when the map type is danger', (): void => {
        setInputs(newCell({ danger_level: 3 }), { ...options, map_type: 'danger' });
        fixture.detectChanges();

        const td: HTMLElement = fixture.nativeElement.querySelector('td.map-cell');
        expect(td.classList).toContain('alert');
        expect(td.classList).toContain('danger-3');
    });

    it('applies the "digs" class when the map type is digs', (): void => {
        setInputs(newCell(), { ...options, map_type: 'digs' });
        fixture.detectChanges();

        const td: HTMLElement = fixture.nativeElement.querySelector('td.map-cell');
        expect(td.classList).toContain('digs');
    });

    it('shows the town marker when the cell is the town', (): void => {
        setInputs(newCell({ is_town: true }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.town-draw')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.content')).toBeNull();
    });

    it('shows the ruin marker (R) when the ruin is explorable', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 7;
        ruin.explorable = true;
        setInputs(newCell({ ruin_id: 7 }));
        fixture.componentRef.setInput('allRuins', [ruin]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.ruin')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.ruin').textContent).toContain('R');
    });

    it('shows the dried marker when the cell is dryed', (): void => {
        setInputs(newCell({ is_dryed: true }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dried')).not.toBeNull();
    });

    it('emits currentHoveredCellChange with the cell on mouseenter and undefined on mouseleave', (): void => {
        const cell: Cell = newCell();
        setInputs(cell);
        fixture.detectChanges();

        const emitted: (Cell | undefined)[] = [];
        fixture.componentInstance.currentHoveredCellChange.subscribe((value: Cell | undefined) => emitted.push(value));

        const td: HTMLElement = fixture.nativeElement.querySelector('td.map-cell');
        td.dispatchEvent(new MouseEvent('mouseenter'));
        td.dispatchEvent(new MouseEvent('mouseleave'));

        expect(emitted).toEqual([cell, undefined]);
    });

    it('opens the update dialog on click and emits cellChange with the dialog result', (): void => {
        const cell: Cell = newCell();
        setInputs(cell);
        fixture.detectChanges();

        const dialog: MatDialog = TestBed.inject(MatDialog);
        const replacement: Cell = newCell({ nb_zombie: 5 });
        spyOn(dialog, 'open').and.returnValue(<never>{ afterClosed: () => of(replacement) });

        const emitted: Cell[] = [];
        fixture.componentInstance.cellChange.subscribe((value: Cell) => emitted.push(value));

        const td: HTMLElement = fixture.nativeElement.querySelector('td.map-cell');
        td.dispatchEvent(new MouseEvent('click'));

        expect(dialog.open).toHaveBeenCalledWith(MapUpdateComponent, jasmine.objectContaining({
            data: jasmine.objectContaining({ cell })
        }));
        expect(emitted).toEqual([replacement]);
    });

    it('does not emit cellChange when the dialog closes without a result', (): void => {
        setInputs(newCell());
        fixture.detectChanges();

        const dialog: MatDialog = TestBed.inject(MatDialog);
        spyOn(dialog, 'open').and.returnValue(<never>{ afterClosed: () => of(undefined) });

        const emitted: Cell[] = [];
        fixture.componentInstance.cellChange.subscribe((value: Cell) => emitted.push(value));

        fixture.nativeElement.querySelector('td.map-cell').dispatchEvent(new MouseEvent('click'));

        expect(emitted).toEqual([]);
    });

    it('does not open the update dialog when the town is observed in readonly mode', (): void => {
        setInputs(newCell());
        fixture.detectChanges();

        TestBed.inject(TownContextService).setObservedTown(new TownDetails());
        const dialog: MatDialog = TestBed.inject(MatDialog);
        spyOn(dialog, 'open');

        fixture.nativeElement.querySelector('td.map-cell').dispatchEvent(new MouseEvent('click'));

        expect(dialog.open).not.toHaveBeenCalled();
    });
});
