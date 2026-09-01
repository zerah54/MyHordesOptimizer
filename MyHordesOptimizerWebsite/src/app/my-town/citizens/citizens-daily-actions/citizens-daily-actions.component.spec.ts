import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TownService } from '../../../_abstract_model/services/town.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizensDailyActionsComponent } from './citizens-daily-actions.component';

interface TestableComponent {
    isDailyActionDone(citizen: Citizen, actionKey: string, day: number): boolean;
    saveDailyAction(citizen: Citizen, actionKey: string, checked: boolean, day: number): void;
    change_detector_ref: ChangeDetectorRef;
}

describe('CitizensDailyActionsComponent', (): void => {
    let component: CitizensDailyActionsComponent;
    let fixture: ComponentFixture<CitizensDailyActionsComponent>;
    let testable: TestableComponent;
    let townService: TownService;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensDailyActionsComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(CitizensDailyActionsComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        townService = TestBed.inject(TownService);
    });

    function makeCitizen(id: number, name: string): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.id = id;
        citizen.name = name;
        citizen.daily_actions = [];
        return citizen;
    }

    describe('rendering after getCitizens() resolves', (): void => {
        it('renders nothing before citizen_info has loaded', (): void => {
            spyOn(townService, 'getCitizens').and.returnValue(of());
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('table')).toBeNull();
        });

        it('renders one row per citizen once getCitizens() resolves (citizen_info + datasource.data)', (): void => {
            const info: CitizenInfo = new CitizenInfo();
            info.citizens = [makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')];
            spyOn(townService, 'getCitizens').and.returnValue(of(info));

            fixture.detectChanges();

            const rows: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('tr[mat-row]');
            expect(rows.length).toBe(2);
            expect(fixture.nativeElement.textContent).toContain('Alice');
            expect(fixture.nativeElement.textContent).toContain('Bob');
        });
    });

    // Régression OnPush (fix de suivi de la Task 11) : citizen.daily_actions mute le citoyen EN
    // PLACE (même référence) — CdkTable met en cache ses lignes par référence de donnée et ne
    // redétecte donc rien seul(e). Sans forçage explicite, aucun citoyen ne se rafraîchit après un
    // clic (aucune notion de "moi" dans ce composant, contrairement à citizens-list).
    it('saveDailyAction forces a synchronous refresh after the HTTP call resolves', (): void => {
        const citizen: Citizen = makeCitizen(42, 'Alice');
        const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);
        const refreshSpy: jasmine.Spy = spyOn(testable.change_detector_ref, 'detectChanges');

        testable.saveDailyAction(citizen, 'home_shower', true, 5);
        httpMock.expectOne((request) => request.url.includes('/dailyAction/')).flush({});

        expect(refreshSpy).toHaveBeenCalled();
        expect(citizen.daily_actions.length).toBe(1);
    });

    it('isDailyActionDone returns false when nothing was saved for that day', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.daily_actions = [];

        expect(testable.isDailyActionDone(citizen, 'home_shower', 5)).toBe(false);
    });

    it('isDailyActionDone returns true for the matching day and key', (): void => {
        const citizen: Citizen = new Citizen();
        const shower: DailyAction = new DailyAction();
        shower.day = 5;
        shower.action_key = 'home_shower';
        shower.update_info = new UpdateInfo();
        citizen.daily_actions = [shower];

        expect(testable.isDailyActionDone(citizen, 'home_shower', 5)).toBe(true);
    });

    it('isDailyActionDone returns false for a different day', (): void => {
        const citizen: Citizen = new Citizen();
        const shower: DailyAction = new DailyAction();
        shower.day = 4;
        shower.action_key = 'home_shower';
        shower.update_info = new UpdateInfo();
        citizen.daily_actions = [shower];

        expect(testable.isDailyActionDone(citizen, 'home_shower', 5)).toBe(false);
    });
});
