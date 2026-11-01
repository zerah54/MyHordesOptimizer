import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TownService } from '../../../_abstract_model/services/town.service';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { setTown } from '../../../_core/utilities/localstorage.util';
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
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();

        townService = TestBed.inject(TownService);
        fixture = TestBed.createComponent(CitizensDispoComponent);
    });

    afterEach((): void => setTown(null));

    it('renders nothing before citizen_info has loaded', (): void => {
        vi.spyOn(townService, 'getCitizens').mockReturnValue(of());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('renders the table with the citizen filter options once getCitizens() resolves', (): void => {
        const info: CitizenInfo = new CitizenInfo();
        info.citizens = [makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')];
        vi.spyOn(townService, 'getCitizens').mockReturnValue(of(info));

        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('mho-header-with-select-filter')).not.toBeNull();
    });

    it('lets the column header go past the day after the current one', (): void => {
        setTown(Object.assign(new TownDetails(), { day: 2 }));
        fixture = TestBed.createComponent(CitizensDispoComponent);
        vi.spyOn(townService, 'getCitizens').mockReturnValue(of(new CitizenInfo()));
        fixture.detectChanges();
        const next: HTMLButtonElement = fixture.nativeElement.querySelector('th button[data-action="next-day"]');

        next.click();
        fixture.detectChanges();
        next.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('th .day').textContent).toContain('J4');
        expect(next.disabled).toBe(false);
    });
});
