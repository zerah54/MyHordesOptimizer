import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizenMenuComponent } from './citizen-menu.component';

interface TestableComponent {
    citizen: Citizen;
    current_day: number;
    isDailyActionDone(actionKey: string): boolean;
}

describe('CitizenMenuComponent', (): void => {
    let component: CitizenMenuComponent;
    let fixture: ComponentFixture<CitizenMenuComponent>;
    let testable: TestableComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizenMenuComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(CitizenMenuComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        testable.citizen = new Citizen();
        testable.citizen.daily_actions = [];
    });

    it('isDailyActionDone returns false when no matching action exists for today', (): void => {
        expect(testable.isDailyActionDone('home_shower')).toBe(false);
    });

    it('isDailyActionDone returns true when a matching action exists for today', (): void => {
        const shower: DailyAction = new DailyAction();
        shower.day = testable.current_day;
        shower.action_key = 'home_shower';
        shower.update_info = new UpdateInfo();
        testable.citizen.daily_actions = [shower];

        expect(testable.isDailyActionDone('home_shower')).toBe(true);
    });
});
