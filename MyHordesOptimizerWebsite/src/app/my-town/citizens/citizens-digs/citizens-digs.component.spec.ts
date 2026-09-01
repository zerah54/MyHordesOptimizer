import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { DigsService } from '../../../_abstract_model/services/digs.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { CitizensDigsComponent } from './citizens-digs.component';

describe('CitizensDigsComponent', (): void => {
    let fixture: ComponentFixture<CitizensDigsComponent>;
    let townService: TownService;
    let digsService: DigsService;

    function makeCitizen(id: number, name: string): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.id = id;
        citizen.name = name;
        citizen.is_dead = false;
        return citizen;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensDigsComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        townService = TestBed.inject(TownService);
        digsService = TestBed.inject(DigsService);
        spyOn(digsService, 'getDigs').and.returnValue(of([]));
        fixture = TestBed.createComponent(CitizensDigsComponent);
    });

    it('renders nothing before citizen_info has loaded', (): void => {
        spyOn(townService, 'getCitizens').and.returnValue(of());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('renders one row per living citizen once getCitizens() resolves (citizen_info + datasource.data)', (): void => {
        const info: CitizenInfo = new CitizenInfo();
        info.citizens = [makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')];
        spyOn(townService, 'getCitizens').and.returnValue(of(info));

        fixture.detectChanges();

        const rows: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('tr[mat-row]');
        expect(rows.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain('Alice');
        expect(fixture.nativeElement.textContent).toContain('Bob');
    });

    it('renders digs for the current day, once both getCitizens() and getDigs() resolve', fakeAsync((): void => {
        const citizen: Citizen = makeCitizen(1, 'Alice');
        const info: CitizenInfo = new CitizenInfo();
        info.citizens = [citizen];
        spyOn(townService, 'getCitizens').and.returnValue(of(info));

        const dig: Dig = new Dig();
        dig.digger_id = 1;
        dig.day = (fixture.componentInstance as unknown as { current_day: number }).current_day;
        dig.x = 3;
        dig.y = 4;
        (digsService.getDigs as jasmine.Spy).and.returnValue(of([dig]));

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('3/4');
    }));
});
