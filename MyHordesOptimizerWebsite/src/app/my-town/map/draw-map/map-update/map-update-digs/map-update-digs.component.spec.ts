import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../../_abstract_model/types/dig.class';
import { setTown } from '../../../../../_core/utilities/localstorage.util';
import { MapUpdateDigsComponent } from './map-update-digs.component';

function newCitizen(id: number, name: string): Citizen {
    const citizen: Citizen = new Citizen();
    citizen.id = id;
    citizen.name = name;
    return citizen;
}

function newDig(overrides: Partial<Dig> = {}): Dig {
    const dig: Dig = new Dig();
    Object.assign(dig, { digger_id: 1, digger_name: 'A', x: 0, y: 0, day: 1, nb_success: 0, nb_total_dig: 0 }, overrides);
    return dig;
}

describe('MapUpdateDigsComponent', (): void => {
    let fixture: ComponentFixture<MapUpdateDigsComponent>;

    beforeEach(async (): Promise<void> => {
        setTown(null);
        await TestBed.configureTestingModule({
            imports: [MapUpdateDigsComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(MapUpdateDigsComponent);
        fixture.componentRef.setInput('cell', Object.assign(new Cell(), { displayed_x: 0, displayed_y: 0 }));
    });

    afterEach((): void => setTown(null));

    it('renders one row per dig on the selected day', (): void => {
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob')]);
        fixture.componentRef.setInput('digs', [newDig({ digger_id: 1, digger_name: 'Alice', day: 1 }), newDig({ digger_id: 2, digger_name: 'Bob', day: 2 })]);
        fixture.detectChanges();

        const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('tbody tr');
        expect(rows.length).toBe(1);
        expect(rows[0].textContent).toContain('Alice');
    });

    it('only offers citizens not yet in the dig list to add', (): void => {
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob')]);
        fixture.componentRef.setInput('digs', [newDig({ digger_id: 1, digger_name: 'Alice' })]);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('thead th button').dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        const menuItems: HTMLElement[] = Array.from(document.querySelectorAll('.mho-add-citizen-list mho-citizen-info'));
        expect(menuItems.length).toBe(1);
        expect(menuItems[0].textContent).toContain('Bob');
    });

    it('addCitizen() emits digsChange with a new dig appended for the selected day, without mutating the original array', (): void => {
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob')]);
        const original: Dig[] = [newDig({ digger_id: 1, digger_name: 'Alice' })];
        fixture.componentRef.setInput('digs', original);
        fixture.detectChanges();

        const emitted: Dig[][] = [];
        fixture.componentInstance.digsChange.subscribe((value: Dig[]) => emitted.push(value));

        (<{ addCitizen(citizen: Citizen): void }>(<unknown>fixture.componentInstance)).addCitizen(newCitizen(2, 'Bob'));

        expect(original.length).toBe(1);
        expect(emitted.length).toBe(1);
        expect(emitted[0].length).toBe(2);
        expect(emitted[0][1].digger_id).toBe(2);
        expect(emitted[0][1].day).toBe(1);
    });

    it('removeCitizen() emits digsChange without the matching dig', (): void => {
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice')]);
        fixture.componentRef.setInput('digs', [newDig({ digger_id: 1, digger_name: 'Alice' })]);
        fixture.detectChanges();

        const emitted: Dig[][] = [];
        fixture.componentInstance.digsChange.subscribe((value: Dig[]) => emitted.push(value));

        fixture.nativeElement.querySelector('tbody tr .remove button').dispatchEvent(new MouseEvent('click'));

        expect(emitted).toEqual([[]]);
    });

    it('defaults the current/selected day to 1 when no town is stored', (): void => {
        fixture.componentRef.setInput('allCitizens', []);
        fixture.componentRef.setInput('digs', []);
        fixture.detectChanges();

        expect((<{ current_day: number }>(<unknown>fixture.componentInstance)).current_day).toBe(1);
    });
});
