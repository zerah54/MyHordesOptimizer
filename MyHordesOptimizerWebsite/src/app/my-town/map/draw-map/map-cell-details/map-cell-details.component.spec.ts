import { ComponentFixture, TestBed } from '@angular/core/testing';
import moment from 'moment';

import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../_abstract_model/types/item-count-short.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { MapCellDetailsComponent } from './map-cell-details.component';

function text(root: HTMLElement, selector: string): string {
    const el: HTMLElement | null = root.querySelector(selector);
    if (!el) throw new Error(`element not found: ${selector}`);
    return el.textContent ?? '';
}

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    cell.is_town = false;
    cell.displayed_x = 3;
    cell.displayed_y = -2;
    cell.nb_pa = 5;
    cell.nb_km = 7;
    cell.nb_zombie = 0;
    cell.nb_zombie_killed = 0;
    cell.nb_hero = 0;
    cell.citizens = [];
    cell.items = [];
    Object.assign(cell, overrides);
    return cell;
}

/** Un `<td>` réellement attaché au document, requis par les pipes de positionnement (offsetParent). */
function newCellHtml(): HTMLTableCellElement {
    const table: HTMLTableElement = document.createElement('table');
    const row: HTMLTableRowElement = table.insertRow();
    const cellHtml: HTMLTableCellElement = row.insertCell();
    document.body.appendChild(table);
    return cellHtml;
}

describe('MapCellDetailsComponent', (): void => {
    let fixture: ComponentFixture<MapCellDetailsComponent>;
    let originalLocale: string;
    const attachedTables: HTMLTableElement[] = [];

    beforeEach(async (): Promise<void> => {
        originalLocale = moment.locale();
        moment.locale('fr');
        await TestBed.configureTestingModule({
            imports: [MapCellDetailsComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(MapCellDetailsComponent);
    });

    afterEach((): void => {
        moment.locale(originalLocale);
        attachedTables.forEach((table: HTMLTableElement): void => table.remove());
        attachedTables.length = 0;
    });

    function setInputs(cell: Cell, cellHtml: HTMLTableCellElement | undefined, allRuins: Ruin[] = [], allCitizens: Citizen[] = [], allItems: Item[] = []): void {
        fixture.componentRef.setInput('cell', cell);
        fixture.componentRef.setInput('cellHtml', cellHtml);
        fixture.componentRef.setInput('allRuins', allRuins);
        fixture.componentRef.setInput('allCitizens', allCitizens);
        fixture.componentRef.setInput('allItems', allItems);
        fixture.detectChanges();
    }

    function attachedCellHtml(): HTMLTableCellElement {
        const cellHtml: HTMLTableCellElement = newCellHtml();
        attachedTables.push(<HTMLTableElement>cellHtml.closest('table'));
        return cellHtml;
    }

    it('renders nothing when cellHtml is not provided', (): void => {
        setInputs(newCell(), undefined);

        expect(fixture.nativeElement.querySelector('.mho-map-cell-detail')).toBeNull();
    });

    it('renders the detail panel once both cell and cellHtml are provided', (): void => {
        setInputs(newCell(), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('.mho-map-cell-detail')).not.toBeNull();
    });

    it('shows the ruin label when the cell sits on a known ruin', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 9;
        ruin.label = { fr: 'Vieux Fort' };
        setInputs(newCell({ ruin_id: 9 }), attachedCellHtml(), [ruin]);

        expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Vieux Fort');
    });

    it('shows "Ville" when the cell is the town center and has no ruin', (): void => {
        setInputs(newCell({ is_town: true }), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Ville');
    });

    it('shows "Désert" when the cell is neither a ruin nor the town center', (): void => {
        setInputs(newCell({ is_town: false }), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Désert');
    });

    it('shows the cell coordinates, action points and distance', (): void => {
        setInputs(newCell({ displayed_x: 3, displayed_y: -2, nb_pa: 5, nb_km: 7 }), attachedCellHtml());

        const coords: HTMLElement = fixture.nativeElement.querySelector('.coords-distance');
        expect(text(coords, '.cords')).toContain('3');
        expect(text(coords, '.cords')).toContain('-2');
        expect(text(coords, '.distance-pa')).toContain('5');
        expect(text(coords, '.distance-km').trim()).toBe('7km');
    });

    it('hides the zombie/heroic-point content block for the town cell', (): void => {
        setInputs(newCell({ is_town: true }), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('.content')).toBeNull();
    });

    it('shows the zombie/heroic-point content block for a non-town cell', (): void => {
        setInputs(newCell({ is_town: false, nb_zombie: 4, nb_zombie_killed: 2, nb_hero: 1 }), attachedCellHtml());

        const content: HTMLElement = fixture.nativeElement.querySelector('.content');
        expect(content).not.toBeNull();
        expect(text(content, '.zombies-here')).toContain('4');
        expect(text(content, '.killed-zombies')).toContain('2');
        expect(text(content, '.pdc')).toContain('1');
    });

    it('does not render the citizens section when the cell has none', (): void => {
        setInputs(newCell({ citizens: [] }), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('.citizens')).toBeNull();
    });

    it('renders present citizens filtered from the full roster', (): void => {
        const present: Citizen = new Citizen();
        present.id = 1;
        present.name = 'Bob';
        const absent: Citizen = new Citizen();
        absent.id = 2;
        absent.name = 'Alice';
        setInputs(newCell({ citizens: [present] }), attachedCellHtml(), [], [present, absent]);

        const citizens: HTMLElement = fixture.nativeElement.querySelector('.citizens');
        expect(citizens).not.toBeNull();
        expect(citizens.textContent).toContain('Bob');
        expect(citizens.textContent).not.toContain('Alice');
    });

    it('does not render the items section when the cell has none', (): void => {
        setInputs(newCell({ items: [] }), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('.items')).toBeNull();
    });

    it('renders one entry per item on the cell, with its quantity', (): void => {
        const item: Item = new Item();
        item.id = 42;
        item.img = 'item42.gif';
        const itemOnCell: ItemCountShort = new ItemCountShort();
        itemOnCell.item_id = 42;
        itemOnCell.count = 3;
        itemOnCell.is_broken = false;
        setInputs(newCell({ items: [itemOnCell] }), attachedCellHtml(), [], [], [item]);

        const items: HTMLElement = fixture.nativeElement.querySelector('.items');
        expect(items).not.toBeNull();
        expect(text(items, '.item-quantity').trim()).toBe('3');
        const img: HTMLImageElement | null = items.querySelector('img');
        expect(img?.src).toContain('item42.gif');
    });

    it('shows the last-update indicator', (): void => {
        setInputs(newCell(), attachedCellHtml());

        expect(fixture.nativeElement.querySelector('.last-update mho-last-update')).not.toBeNull();
    });
});
