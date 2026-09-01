import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import moment from 'moment';
import { of } from 'rxjs';

import { ApiService } from '../../../../../_abstract_model/services/api.service';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { MapUpdateCellComponent } from './map-update-cell.component';

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    Object.assign(cell, {
        nb_zombie: 0,
        nb_zombie_killed: 0,
        nb_hero: 0,
        is_dryed: false,
        items: [],
        citizens: [],
        scav_zone_level: null,
        scout_zone_level: null,
        scav_next_cells: null,
        scout_next_cells: null,
        update_info: undefined
    });
    Object.assign(cell, overrides);
    return cell;
}

function newItem(id: number, label: string): Item {
    const item: Item = new Item();
    Object.assign(item, { id, label: { [moment.locale()]: label }, img: 'img.png', img_broken: null, is_broken: false });
    return item;
}

describe('MapUpdateCellComponent', (): void => {
    let fixture: ComponentFixture<MapUpdateCellComponent>;
    let apiService: ApiService;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MapUpdateCellComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();
        apiService = TestBed.inject(ApiService);
    });

    function create(items: Item[] = [newItem(1, 'Pelle'), newItem(2, 'Pioche')]): void {
        spyOn(apiService, 'getItems').and.returnValue(of(items));
        fixture = TestBed.createComponent(MapUpdateCellComponent);
        fixture.componentRef.setInput('cell', newCell());
        fixture.componentRef.setInput('citizens', []);
    }

    it('lists every available item in the "add" menu once getItems() resolves', (): void => {
        create();
        fixture.detectChanges();

        // cellule sans objet : seule l'icône "add" (pas de "remove") est présente dans .add-remove
        const addTrigger: HTMLElement = fixture.nativeElement.querySelector('.add-remove img');
        addTrigger.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        const menuImages: HTMLElement[] = Array.from(document.querySelectorAll('.menu-add .items img'));
        expect(menuImages.length).toBe(2);
    });

    it('renders no item entries in the cell items list when the cell has none', (): void => {
        create();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('.items > div').length).toBe(0);
    });

    it('addItem() increments the count when the item is already in the list, without a duplicate entry', (): void => {
        const items: Item[] = [newItem(1, 'Pelle')];
        create(items);
        const cell: Cell = newCell({ items: [new ItemCountShort({ count: 1, isBroken: false, id: 1 })] });
        fixture.componentRef.setInput('cell', cell);
        fixture.detectChanges();

        (<{ addItem(cell: Cell, item_id: number): void }>(<unknown>fixture.componentInstance)).addItem(cell, 1);

        expect(cell.items.length).toBe(1);
        expect(cell.items[0].count).toBe(2);
    });

    it('addItem() appends a new entry when the item is not yet in the list', (): void => {
        const items: Item[] = [newItem(1, 'Pelle')];
        create(items);
        const cell: Cell = newCell({ items: [] });
        fixture.componentRef.setInput('cell', cell);
        fixture.detectChanges();

        (<{ addItem(cell: Cell, item_id: number): void }>(<unknown>fixture.componentInstance)).addItem(cell, 1);

        expect(cell.items.length).toBe(1);
        expect(cell.items[0].item_id).toBe(1);
        expect(cell.items[0].count).toBe(1);
    });

    it('removeItem() decrements the count, and removes the entry once it reaches 0', (): void => {
        create();
        const cell: Cell = newCell({ items: [new ItemCountShort({ count: 2, isBroken: false, id: 1 })] });
        fixture.componentRef.setInput('cell', cell);
        fixture.detectChanges();

        (<{ removeItem(cell: Cell, item_id: number): void }>(<unknown>fixture.componentInstance)).removeItem(cell, 1);
        expect(cell.items[0].count).toBe(1);

        (<{ removeItem(cell: Cell, item_id: number): void }>(<unknown>fixture.componentInstance)).removeItem(cell, 1);
        expect(cell.items.length).toBe(0);
    });

    it('emptyItems() clears every item from the cell', (): void => {
        create();
        const cell: Cell = newCell({ items: [new ItemCountShort({ count: 2, isBroken: false, id: 1 })] });
        fixture.componentRef.setInput('cell', cell);
        fixture.detectChanges();

        (<{ emptyItems(cell: Cell): void }>(<unknown>fixture.componentInstance)).emptyItems(cell);

        expect(cell.items.length).toBe(0);
    });

    it('emits cellChange with the updated fields when the reactive form changes', (): void => {
        create();
        const cell: Cell = newCell({ nb_zombie: 0 });
        fixture.componentRef.setInput('cell', cell);
        fixture.detectChanges();

        const emitted: Cell[] = [];
        fixture.componentInstance.cellChange.subscribe((value: Cell) => emitted.push(value));

        const zombiesInput: HTMLInputElement = fixture.nativeElement.querySelector('.zombies-here input');
        zombiesInput.value = '7';
        zombiesInput.dispatchEvent(new Event('input'));

        expect(emitted.length).toBe(1);
        expect(emitted[0].nb_zombie).toBe(7);
    });

    it('shows the citizens\' bag items section only when the cell has citizens', (): void => {
        create();
        fixture.componentRef.setInput('cell', newCell({ citizens: [] }));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.bags-header')).toBeNull();

        const citizen: Citizen = new Citizen();
        citizen.id = 1;
        citizen.name = 'Alice';
        fixture.componentRef.setInput('cell', newCell({ citizens: [citizen] }));
        fixture.componentRef.setInput('citizens', [citizen]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.bags-header')).not.toBeNull();
    });
});
