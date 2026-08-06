import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizensListComponent } from './citizens-list.component';

interface TestableComponent {
    current_day: number;
    citizen_list: { data: Citizen[] };
    lastUpdates(citizen: Citizen): { label: string; info: UpdateInfo | undefined; }[];
    sortValue(citizen: Citizen, id: string): string | number;
    citizenBoolValue(citizen: Citizen, id: string): boolean | null;
    getDailyAction(citizen: Citizen, action: DailyActionEnum): { element: DailyActionEnum; value: boolean };
    saveDailyAction(actionKey: string, checked: boolean, citizenId: number): void;
}

describe('CitizensListComponent', (): void => {
    let component: CitizensListComponent;
    let fixture: ComponentFixture<CitizensListComponent>;
    let testable: TestableComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensListComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(CitizensListComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
    });

    function citizenWithBathToday(): Citizen {
        const citizen: Citizen = new Citizen();
        const pool: DailyAction = new DailyAction();
        pool.day = testable.current_day;
        pool.action_key = 'home_pool';
        pool.update_info = new UpdateInfo();
        citizen.daily_actions = [pool];
        return citizen;
    }

    it('lastUpdates reads the bath entry from daily_actions', (): void => {
        const citizen: Citizen = citizenWithBathToday();

        const entries: { label: string; info: UpdateInfo | undefined; }[] = testable.lastUpdates(citizen);
        const bath_entry: { label: string; info: UpdateInfo | undefined; } | undefined =
            entries.find((entry: { label: string; info: UpdateInfo | undefined; }) => entry.info === citizen.daily_actions[0].update_info);

        expect(bath_entry).toBeTruthy();
    });

    it('sortValue returns 1 for daily_home_pool when the citizen bathed today', (): void => {
        expect(testable.sortValue(citizenWithBathToday(), 'daily_home_pool')).toBe(1);
    });

    it('sortValue returns 0 for daily_home_pool when the citizen did not bathe today', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.daily_actions = [];

        expect(testable.sortValue(citizen, 'daily_home_pool')).toBe(0);
    });

    it('sortValue does not confuse daily_home_pool with the home_ prefix', (): void => {
        expect(testable.sortValue(citizenWithBathToday(), 'daily_home_pool')).toBe(1);
    });

    it('citizenBoolValue returns true for daily_home_pool when the citizen bathed today', (): void => {
        expect(testable.citizenBoolValue(citizenWithBathToday(), 'daily_home_pool')).toBe(true);
    });

    it('getDailyAction resolves the current boolean value for a citizen/action pair', (): void => {
        const result: { element: DailyActionEnum; value: boolean } = testable.getDailyAction(citizenWithBathToday(), DailyActionEnum.HOME_POOL);

        expect(result.element).toBe(DailyActionEnum.HOME_POOL);
        expect(result.value).toBe(true);
    });

    it('saveDailyAction looks up the citizen by id (deferred-cell context passes an id, not a reference)', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;
        citizen.daily_actions = [];
        testable.citizen_list = { data: [citizen] };

        expect((): void => testable.saveDailyAction?.('home_shower', true, 42)).not.toThrow();
    });
});
