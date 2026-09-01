import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { MapUpdateCitizensComponent } from './map-update-citizens.component';

function newCitizen(id: number, name: string): Citizen {
    const citizen: Citizen = new Citizen();
    citizen.id = id;
    citizen.name = name;
    citizen.town_roles = [];
    citizen.daily_actions = [];
    return citizen;
}

describe('MapUpdateCitizensComponent', (): void => {
    let fixture: ComponentFixture<MapUpdateCitizensComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MapUpdateCitizensComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(MapUpdateCitizensComponent);
    });

    it('renders one row per citizen currently on the cell', (): void => {
        fixture.componentRef.setInput('citizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob')]);
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob'), newCitizen(3, 'Carol')]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('only offers the "add a citizen" button and menu entries for citizens not already on the cell', (): void => {
        fixture.componentRef.setInput('citizens', [newCitizen(1, 'Alice')]);
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob')]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('thead button')).not.toBeNull();

        fixture.nativeElement.querySelector('thead button').dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        const menuItems: HTMLElement[] = Array.from(document.querySelectorAll('.mho-add-citizen-list mho-citizen-info'));
        expect(menuItems.length).toBe(1);
        expect(menuItems[0].textContent).toContain('Bob');
    });

    it('hides the "add a citizen" button when every citizen is already on the cell', (): void => {
        fixture.componentRef.setInput('citizens', [newCitizen(1, 'Alice')]);
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice')]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('thead button')).toBeNull();
    });

    it('addCitizen() emits citizensChange with the citizen appended and the list sorted by name, without mutating the original array', (): void => {
        const original: Citizen[] = [newCitizen(2, 'Bob')];
        fixture.componentRef.setInput('citizens', original);
        fixture.componentRef.setInput('allCitizens', [newCitizen(1, 'Alice'), newCitizen(2, 'Bob')]);
        fixture.detectChanges();

        const emitted: Citizen[][] = [];
        fixture.componentInstance.citizensChange.subscribe((value: Citizen[]) => emitted.push(value));

        (<{ addCitizen(citizen: Citizen): void }>(<unknown>fixture.componentInstance)).addCitizen(newCitizen(1, 'Alice'));

        expect(original.length).toBe(1); // le tableau reçu en entrée n'est pas muté en place
        expect(emitted.length).toBe(1);
        expect(emitted[0].map((citizen: Citizen) => citizen.name)).toEqual(['Alice', 'Bob']);
    });
});
