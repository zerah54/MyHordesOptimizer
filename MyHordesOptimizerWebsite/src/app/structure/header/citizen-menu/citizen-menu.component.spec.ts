import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { of, throwError } from 'rxjs';

import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Bag } from '../../../_abstract_model/types/bag.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { HeroicActionsWithValue } from '../../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Status } from '../../../_abstract_model/types/status.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizenMenuComponent } from './citizen-menu.component';

interface TestableComponent {
    citizen: { (): Citizen | undefined; set(value: Citizen | undefined): void };
    current_day: number;
    all_items: Item[];
    bag_lists: { (): ListForAddRemove[]; set(value: ListForAddRemove[]): void };
    status_trigger: () => MatMenuTrigger | undefined;
    bag_trigger: () => MatMenuTrigger | undefined;
    daily_actions_trigger: () => MatMenuTrigger | undefined;
    heroic_actions_trigger: () => MatMenuTrigger | undefined;
    home_trigger: () => MatMenuTrigger | undefined;
    isDailyActionDone(actionKey: string): boolean;
    closeOtherMenus(opened: 'status' | 'bag' | 'dailyActions' | 'heroicActions' | 'home'): void;
    addItem(item_id: number): void;
    removeItem(item_id: number): void;
    emptyBag(): void;
    addStatus(status_key: string): void;
    removeStatus(status_key: string): void;
    emptyStatus(): void;
    saveDailyAction(actionKey: string, checked: boolean): void;
    changePotions(value: number): void;
    changeImmune(immune: boolean): void;
    updateHome(element: HomeWithValue, value: number | boolean): void;
    updateActions(element: HeroicActionsWithValue, value: number | boolean): void;
}

describe('CitizenMenuComponent', (): void => {
    let component: CitizenMenuComponent;
    let fixture: ComponentFixture<CitizenMenuComponent>;
    let testable: TestableComponent;
    let townService: TownService;
    let apiService: ApiService;

    function makeCitizen(): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.id = 1;
        citizen.daily_actions = [];
        citizen.bag = new Bag();
        citizen.bag.items = [];
        citizen.bag.update_info = new UpdateInfo();
        citizen.status = new Status();
        citizen.status.icons = [];
        citizen.status.update_info = new UpdateInfo();
        citizen.chamanic_detail = { nb_potion_shaman: 0, is_immune_to_soul: false, update_info: new UpdateInfo() } as never;
        return citizen;
    }

    function makeItem(id: number): Item {
        const item: Item = new Item();
        item.id = id;
        return item;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizenMenuComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(CitizenMenuComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        townService = TestBed.inject(TownService);
        apiService = TestBed.inject(ApiService);
        testable.citizen.set(makeCitizen());
        testable.all_items = [makeItem(10), makeItem(20)];
    });

    it('isDailyActionDone returns false when no matching action exists for today', (): void => {
        expect(testable.isDailyActionDone('home_shower')).toBe(false);
    });

    it('isDailyActionDone returns true when a matching action exists for today', (): void => {
        const shower: DailyAction = new DailyAction();
        shower.day = testable.current_day;
        shower.action_key = 'home_shower';
        shower.update_info = new UpdateInfo();
        testable.citizen()!.daily_actions = [shower];

        expect(testable.isDailyActionDone('home_shower')).toBe(true);
    });

    describe('ngOnInit', (): void => {
        it('subscribes to myCitizen$ and adopts the published citizen', (): void => {
            const published: Citizen = makeCitizen();
            published.id = 42;
            fixture.detectChanges();

            townService.publishMyCitizen(published);

            expect(testable.citizen()!.id).toBe(42);
        });

        it('clones the published citizen instead of keeping the same reference (OnPush notification)', (): void => {
            const published: Citizen = makeCitizen();
            fixture.detectChanges();

            townService.publishMyCitizen(published);

            expect(testable.citizen()).not.toBe(published);
        });

        it('loads items and builds a single "all items" bag list', (): void => {
            const items: Item[] = [makeItem(1), makeItem(2)];
            spyOn(apiService, 'getItems').and.returnValue(of(items));

            fixture.detectChanges();

            expect(testable.bag_lists().length).toBe(1);
            expect(testable.bag_lists()[0].list).toEqual(items);
        });
    });

    describe('closeOtherMenus', (): void => {
        it('closes every trigger except the one that just opened', (): void => {
            const status_trigger: jasmine.SpyObj<MatMenuTrigger> = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
            const bag_trigger: jasmine.SpyObj<MatMenuTrigger> = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
            const daily_actions_trigger: jasmine.SpyObj<MatMenuTrigger> = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
            const heroic_actions_trigger: jasmine.SpyObj<MatMenuTrigger> = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
            const home_trigger: jasmine.SpyObj<MatMenuTrigger> = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
            // Les viewChild() sont des signaux en lecture seule : on remplace la fonction elle-même,
            // comme le ferait la vue une fois la référence résolue.
            testable.status_trigger = (): MatMenuTrigger => status_trigger;
            testable.bag_trigger = (): MatMenuTrigger => bag_trigger;
            testable.daily_actions_trigger = (): MatMenuTrigger => daily_actions_trigger;
            testable.heroic_actions_trigger = (): MatMenuTrigger => heroic_actions_trigger;
            testable.home_trigger = (): MatMenuTrigger => home_trigger;

            testable.closeOtherMenus('bag');

            expect(status_trigger.closeMenu).toHaveBeenCalled();
            expect(bag_trigger.closeMenu).not.toHaveBeenCalled();
            expect(daily_actions_trigger.closeMenu).toHaveBeenCalled();
            expect(heroic_actions_trigger.closeMenu).toHaveBeenCalled();
            expect(home_trigger.closeMenu).toHaveBeenCalled();
        });
    });

    describe('bag mutations', (): void => {
        it('addItem adds the item to the bag and persists it', (): void => {
            spyOn(townService, 'updateBag').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.addItem(10);

            expect(testable.citizen()!.bag?.items.length).toBe(1);
            expect(testable.citizen()!.bag?.items[0].id).toBe(10);
            expect(townService.updateBag).toHaveBeenCalled();
            expect(townService.publishMyCitizen).toHaveBeenCalledWith(testable.citizen()!);
        });

        it('addItem reassigns bag.items immutably (child OnPush input notification)', (): void => {
            const original_items: Item[] = testable.citizen()!.bag!.items;
            spyOn(townService, 'updateBag').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.addItem(10);

            expect(testable.citizen()!.bag!.items).not.toBe(original_items);
        });

        it('removeItem removes the matching item from the bag and persists it', (): void => {
            testable.citizen()!.bag!.items = [makeItem(10), makeItem(20)];
            spyOn(townService, 'updateBag').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.removeItem(10);

            expect(testable.citizen()!.bag?.items.map((item: Item) => item.id)).toEqual([20]);
        });

        it('emptyBag clears the bag and persists it', (): void => {
            testable.citizen()!.bag!.items = [makeItem(10)];
            spyOn(townService, 'updateBag').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.emptyBag();

            expect(testable.citizen()!.bag?.items).toEqual([]);
        });
    });

    describe('status mutations', (): void => {
        it('addStatus adds the status and persists it', (): void => {
            spyOn(townService, 'updateStatus').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.addStatus(StatusEnum.TIRED.key);

            expect(testable.citizen()!.status?.icons.length).toBe(1);
            expect(testable.citizen()!.status?.icons[0].key).toBe(StatusEnum.TIRED.key);
        });

        it('removeStatus removes the matching status and persists it', (): void => {
            testable.citizen()!.status!.icons = [StatusEnum.TIRED];
            spyOn(townService, 'updateStatus').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.removeStatus(StatusEnum.TIRED.key);

            expect(testable.citizen()!.status?.icons).toEqual([]);
        });

        it('emptyStatus clears the statuses and persists them', (): void => {
            testable.citizen()!.status!.icons = [StatusEnum.TIRED];
            spyOn(townService, 'updateStatus').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.emptyStatus();

            expect(testable.citizen()!.status?.icons).toEqual([]);
        });
    });

    describe('saveDailyAction', (): void => {
        it('adds a daily action once the server confirms', (): void => {
            spyOn(townService, 'addDailyAction').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.saveDailyAction('home_shower', true);

            expect(testable.citizen()!.daily_actions.length).toBe(1);
            expect(testable.citizen()!.daily_actions[0].action_key).toBe('home_shower');
        });

        it('removes the matching daily action once the server confirms', (): void => {
            const shower: DailyAction = new DailyAction();
            shower.day = testable.current_day;
            shower.action_key = 'home_shower';
            testable.citizen()!.daily_actions = [shower];
            spyOn(townService, 'removeDailyAction').and.returnValue(of(undefined));
            spyOn(townService, 'publishMyCitizen');

            testable.saveDailyAction('home_shower', false);

            expect(testable.citizen()!.daily_actions).toEqual([]);
        });
    });

    describe('chamanic details', (): void => {
        it('changePotions updates the potion count and persists it', (): void => {
            spyOn(townService, 'saveChamanicDetails').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.changePotions(3);

            expect(testable.citizen()!.chamanic_detail.nb_potion_shaman).toBe(3);
            expect(townService.saveChamanicDetails).toHaveBeenCalled();
        });

        it('changeImmune updates the immunity flag and persists it', (): void => {
            spyOn(townService, 'saveChamanicDetails').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.changeImmune(true);

            expect(testable.citizen()!.chamanic_detail.is_immune_to_soul).toBe(true);
        });
    });

    describe('updateHome', (): void => {
        it('sets the new value optimistically and persists it', (): void => {
            testable.citizen()!.home = { content: [], update_info: new UpdateInfo() } as never;
            const element: HomeWithValue = { value: 1, element: { key: 'x' } } as unknown as HomeWithValue;
            spyOn(townService, 'updateHome').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.updateHome(element, 5);

            expect(element.value).toBe(5);
        });

        it('rolls back the value and notifies the view when the update fails', (): void => {
            testable.citizen()!.home = { content: [], update_info: new UpdateInfo() } as never;
            const element: HomeWithValue = { value: 1, element: { key: 'x' } } as unknown as HomeWithValue;
            const citizen_before: Citizen = testable.citizen()!;
            spyOn(townService, 'updateHome').and.returnValue(throwError(() => new Error('fail')));

            testable.updateHome(element, 5);

            expect(element.value).toBe(1);
            expect(testable.citizen()).not.toBe(citizen_before);
        });
    });

    describe('updateActions', (): void => {
        it('sets the new value optimistically and persists it', (): void => {
            testable.citizen()!.heroic_actions = { content: [], update_info: new UpdateInfo() } as never;
            const element: HeroicActionsWithValue = { value: 0, element: { value: { max_lvl: 1 } } } as unknown as HeroicActionsWithValue;
            spyOn(townService, 'updateHeroicActions').and.returnValue(of(new UpdateInfo()));
            spyOn(townService, 'publishMyCitizen');

            testable.updateActions(element, 1);

            expect(element.value).toBe(1);
        });

        it('rolls back the value and notifies the view when the update fails', (): void => {
            testable.citizen()!.heroic_actions = { content: [], update_info: new UpdateInfo() } as never;
            const element: HeroicActionsWithValue = { value: 0, element: { value: { max_lvl: 1 } } } as unknown as HeroicActionsWithValue;
            const citizen_before: Citizen = testable.citizen()!;
            spyOn(townService, 'updateHeroicActions').and.returnValue(throwError(() => new Error('fail')));

            testable.updateActions(element, 1);

            expect(element.value).toBe(0);
            expect(testable.citizen()).not.toBe(citizen_before);
        });
    });
});
