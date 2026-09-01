import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import moment from 'moment';

import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../../_abstract_model/types/ruin.class';
import { RuinItem } from '../../../../../_abstract_model/types/ruin-item.class';
import { setTown } from '../../../../../_core/utilities/localstorage.util';
import { MapUpdateRuinComponent } from './map-update-ruin.component';

function newRuin(overrides: Partial<Ruin> = {}): Ruin {
    const ruin: Ruin = new Ruin();
    Object.assign(ruin, {
        id: 1,
        camping: 5,
        label: { [moment.locale()]: 'Ruine' },
        description: { [moment.locale()]: 'Une description' },
        explorable: false,
        drops: [],
        min_dist: 0,
        max_dist: 10
    });
    Object.assign(ruin, overrides);
    return ruin;
}

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    Object.assign(cell, {
        ruin_id: 1,
        nb_km: 3,
        nb_eruin_yellow: 0,
        nb_eruin_blue: 0,
        nb_eruin_violet: 0,
        nb_ruin_dig: 0,
        is_ruin_dryed: false
    });
    Object.assign(cell, overrides);
    return cell;
}

describe('MapUpdateRuinComponent', (): void => {
    let fixture: ComponentFixture<MapUpdateRuinComponent>;

    beforeEach(async (): Promise<void> => {
        setTown(null);
        await TestBed.configureTestingModule({
            imports: [MapUpdateRuinComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(MapUpdateRuinComponent);
    });

    afterEach((): void => setTown(null));

    function setInputs(ruin: Ruin, cell: Cell, allRuins: Ruin[] = []): void {
        fixture.componentRef.setInput('ruin', ruin);
        fixture.componentRef.setInput('allRuins', allRuins);
        fixture.componentRef.setInput('cell', cell);
    }

    it('shows the description and camping bonus of the ruin', (): void => {
        setInputs(newRuin({ description: { [moment.locale()]: 'Cave sombre' }, camping: 8 }), newCell());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-map-update-ruin').textContent).toContain('Cave sombre');
        expect(fixture.nativeElement.textContent).toContain('8');
    });

    it('shows the dig-count field when the ruin is not explorable and the cell ruin_id is negative', (): void => {
        setInputs(newRuin({ explorable: false }), newCell({ ruin_id: -3 }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[formcontrolname="nb_ruin_dig"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[formcontrolname="is_ruin_dryed"]')).toBeNull();
    });

    it('shows the "dryed" checkbox when the ruin is not explorable and the cell ruin_id is positive', (): void => {
        setInputs(newRuin({ explorable: false }), newCell({ ruin_id: 3 }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[formcontrolname="is_ruin_dryed"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[formcontrolname="nb_ruin_dig"]')).toBeNull();
    });

    it('shows the eruin plan fields when the ruin is explorable', (): void => {
        setInputs(newRuin({ explorable: true }), newCell());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[formcontrolname="nb_eruin_yellow"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[formcontrolname="nb_eruin_blue"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[formcontrolname="nb_eruin_violet"]')).not.toBeNull();
    });

    it('emits cellChange with the updated eruin counts when the form changes', (): void => {
        setInputs(newRuin({ explorable: true }), newCell());
        fixture.detectChanges();

        const emitted: Cell[] = [];
        fixture.componentInstance.cellChange.subscribe((value: Cell) => emitted.push(value));

        const yellowInput: HTMLInputElement = fixture.nativeElement.querySelector('[formcontrolname="nb_eruin_yellow"]');
        yellowInput.value = '4';
        yellowInput.dispatchEvent(new Event('input'));

        expect(emitted.length).toBe(1);
        expect(emitted[0].nb_eruin_yellow).toBe(4);
    });

    it('shows the drops list when the ruin has drops', (): void => {
        const drop: RuinItem = new RuinItem();
        drop.probability = 0.5;
        drop.item = Object.assign(new Item(), { id: 1, img: 'img.png', label: { [moment.locale()]: 'Objet' } });
        setInputs(newRuin({ drops: [drop] }), newCell());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.drops')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.drops').textContent).toContain('Objet');
    });

    it('hides the drops list when the ruin has no drops', (): void => {
        setInputs(newRuin({ drops: [] }), newCell());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.drops')).toBeNull();
    });

    it('shows the list of possible buildings, filtered by distance, when the ruin id is -1', (): void => {
        const inRange: Ruin = newRuin({ id: 2, label: { [moment.locale()]: 'Proche' }, min_dist: 0, max_dist: 5 });
        const outOfRange: Ruin = newRuin({ id: 3, label: { [moment.locale()]: 'Loin' }, min_dist: 20, max_dist: 30 });
        setInputs(newRuin({ id: -1 }), newCell({ nb_km: 3 }), [inRange, outOfRange]);
        fixture.detectChanges();

        const items: string = fixture.nativeElement.querySelector('mat-list').textContent;
        expect(items).toContain('Proche');
        expect(items).not.toContain('Loin');
    });
});
