import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizensDailyActionsComponent } from './citizens-daily-actions.component';

interface TestableComponent {
    isDailyActionDone(citizen: Citizen, actionKey: string, day: number): boolean;
}

describe('CitizensDailyActionsComponent', (): void => {
    let component: CitizensDailyActionsComponent;
    let fixture: ComponentFixture<CitizensDailyActionsComponent>;
    let testable: TestableComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensDailyActionsComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(CitizensDailyActionsComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
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
