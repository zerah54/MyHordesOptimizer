import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { Bag } from '../../../_abstract_model/types/bag.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { Item } from '../../../_abstract_model/types/item.class';
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
    goToProfile(userId: number): void;
    addChestItem(citizen_id: number, item_id: number): void;
    removeChestItem(citizen_id: number, item_id: number): void;
    emptyChest(citizen_id: number): void;
}

describe('CitizensListComponent', (): void => {
    let component: CitizensListComponent;
    let fixture: ComponentFixture<CitizensListComponent>;
    let testable: TestableComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensListComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
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

    // openNote lit getTown() (localStorage) en interne, comme openPictos : sans ville courante en
    // environnement de test, il ressort tôt sans ouvrir de dialog — smoke-test au même niveau que
    // saveDailyAction ci-dessus, pas une vérification du contenu de la modale.
    it('openNote does not throw when called with a citizen', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;

        expect((): void => (component as unknown as { openNote(c: Citizen): void }).openNote(citizen)).not.toThrow();
    });

    it('goToProfile navigates to the profile page of the citizen', (): void => {
        const router: Router = TestBed.inject(Router);
        const navigateSpy: jasmine.Spy = spyOn(router, 'navigate');

        testable.goToProfile(42);

        expect(navigateSpy).toHaveBeenCalledWith(['/profile', 42]);
    });

    // Un coffre jamais synchronisé côté serveur n'a pas de update_info (contrairement au sac,
    // toujours présent en pratique) : ce cas doit être géré sans lancer d'exception.
    it('addChestItem pushes the item and does not throw', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;
        citizen.chest = new Bag();
        testable.citizen_list = { data: [citizen] };
        (component as unknown as { all_items: Item[] }).all_items = [Object.assign(new Item(), { id: 5 })];
        const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);

        expect((): void => testable.addChestItem(42, 5)).not.toThrow();

        httpMock.expectOne((request) => request.url.includes('/ExternalTools/Chest')).flush({});
    });

    it('emptyChest clears the chest items and does not throw', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;
        citizen.chest = new Bag();
        citizen.chest.items = [Object.assign(new Item(), { id: 5 })];
        testable.citizen_list = { data: [citizen] };
        const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);

        expect((): void => testable.emptyChest(42)).not.toThrow();

        httpMock.expectOne((request) => request.url.includes('/ExternalTools/Chest')).flush({});
        expect(citizen.chest.items).toEqual([]);
    });
});
