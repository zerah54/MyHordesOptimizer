import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TownService } from '../../../_abstract_model/services/town.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { CitizensDispoComponent } from './citizens-dispo.component';

describe('CitizensDispoComponent', (): void => {
    let fixture: ComponentFixture<CitizensDispoComponent>;
    let townService: TownService;

    function makeCitizen(id: number, name: string): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.id = id;
        citizen.name = name;
        citizen.is_dead = false;
        return citizen;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensDispoComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        townService = TestBed.inject(TownService);
        fixture = TestBed.createComponent(CitizensDispoComponent);
    });

    it('renders nothing before citizen_info has loaded', (): void => {
        spyOn(townService, 'getCitizens').and.returnValue(of());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('renders the table with the citizen filter options once getCitizens() resolves', (): void => {
        const info: CitizenInfo = new CitizenInfo();
        info.citizens = [makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')];
        spyOn(townService, 'getCitizens').and.returnValue(of(info));

        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('mho-header-with-select-filter')).not.toBeNull();
    });
});
