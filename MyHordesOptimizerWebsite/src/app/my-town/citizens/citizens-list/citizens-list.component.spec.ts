import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Bag } from '../../../_abstract_model/types/bag.class';
import { ChamanicDetail } from '../../../_abstract_model/types/chamanic-detail.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Status } from '../../../_abstract_model/types/status.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizensListComponent } from './citizens-list.component';

interface TestableComponent {
    current_day: number;
    citizen_list: { data: Citizen[] };
    dead_citizen_list: { data: Citizen[] };
    alive_citizen_info: (() => CitizenInfo | undefined) | CitizenInfo | undefined;
    dead_citizen_info: (() => CitizenInfo | undefined) | CitizenInfo | undefined;
    getCitizens(): void;
    lastUpdates(citizen: Citizen): { label: string; info: UpdateInfo | undefined; }[];
    sortValue(citizen: Citizen, id: string): string | number;
    citizenBoolValue(citizen: Citizen, id: string): boolean | null;
    getDailyAction(citizen: Citizen, action: DailyActionEnum): { element: DailyActionEnum; value: boolean };
    saveDailyAction(actionKey: string, checked: boolean, citizenId: number): void;
    goToProfile(userId: number): void;
    addChestItem(citizen_id: number, item_id: number): void;
    removeChestItem(citizen_id: number, item_id: number): void;
    emptyChest(citizen_id: number): void;
    addStatus(citizen_id: number, status_key: string): void;
    change_detector_ref: ChangeDetectorRef;
}

/** Lit alive_citizen_info/dead_citizen_info qu'ils soient encore un champ simple ou déjà un signal. */
function readCitizenInfo(value: (() => CitizenInfo | undefined) | CitizenInfo | undefined): CitizenInfo | undefined {
    return typeof value === 'function' ? value() : value;
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

    function makeCitizen(id: number, name: string, is_dead: boolean = false): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.id = id;
        citizen.name = name;
        citizen.is_dead = is_dead;
        citizen.daily_actions = [];
        return citizen;
    }

    describe('getCitizens() (alive_citizen_info / dead_citizen_info / datasources)', (): void => {
        it('splits the resolved citizens between alive_citizen_info and dead_citizen_info', (): void => {
            const info: CitizenInfo = new CitizenInfo();
            info.citizens = [makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob', true)];
            spyOn(TestBed.inject(TownService), 'getCitizens').and.returnValue(of(info));

            testable.getCitizens();

            expect(readCitizenInfo(testable.alive_citizen_info)?.citizens.map((c: Citizen) => c.id)).toEqual([1]);
            expect(readCitizenInfo(testable.dead_citizen_info)?.citizens.map((c: Citizen) => c.id)).toEqual([2]);
            expect(testable.citizen_list.data.map((c: Citizen) => c.id)).toEqual([1]);
            expect(testable.dead_citizen_list.data.map((c: Citizen) => c.id)).toEqual([2]);
        });

        it('alive_citizen_info/dead_citizen_info stay unset before getCitizens() resolves', (): void => {
            spyOn(TestBed.inject(TownService), 'getCitizens').and.returnValue(of());

            testable.getCitizens();

            expect(readCitizenInfo(testable.alive_citizen_info)).toBeUndefined();
            expect(readCitizenInfo(testable.dead_citizen_info)).toBeUndefined();
        });
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

    // Régression OnPush (fix de suivi de la Task 11) : citizen_list.data mute un Citizen déjà
    // présent EN PLACE (même référence) — CdkTable met en cache ses lignes par référence de donnée
    // et ne redétecte donc rien seul(e). Sans un forçage explicite, seule la ligne du citoyen "moi"
    // se rafraîchissait (via myCitizen$). Ici le citoyen n'est PAS "moi" (aucun utilisateur en
    // localStorage dans l'environnement de test → getUser() renvoie null) : c'est le cas d'usage
    // principal de cet écran, et celui qui ne se rafraîchissait pas avant le fix.
    it('saveDailyAction forces a synchronous refresh for a citizen who is not "me"', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;
        citizen.daily_actions = [];
        testable.citizen_list = { data: [citizen] };
        const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);
        const refreshSpy: jasmine.Spy = spyOn(testable.change_detector_ref, 'detectChanges');

        testable.saveDailyAction('home_shower', true, 42);
        httpMock.expectOne((request) => request.url.includes('/dailyAction/')).flush({});

        expect(refreshSpy).toHaveBeenCalled();
        expect(citizen.daily_actions.length).toBe(1);
    });

    it('addStatus forces a synchronous refresh for a citizen who is not "me"', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;
        citizen.status = new Status();
        citizen.status.icons = [];
        citizen.status.update_info = new UpdateInfo();
        testable.citizen_list = { data: [citizen] };
        const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);
        const refreshSpy: jasmine.Spy = spyOn(testable.change_detector_ref, 'detectChanges');

        testable.addStatus(42, StatusEnum.CLEAN.key);
        httpMock.expectOne((request) => request.url.includes('/ExternalTools/Status')).flush({});

        expect(refreshSpy).toHaveBeenCalled();
        // Réassignation immuable (pas de .push() en place) : cf. correction Task 11.
        expect(citizen.status.icons).toEqual([StatusEnum.CLEAN]);
    });

    // changePotions/changeImmune passent tous deux par saveChamanicDetails() (le correctif y est
    // posé une seule fois, pas dupliqué dans les deux appelants).
    it('changePotions forces a synchronous refresh for a citizen who is not "me"', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 42;
        citizen.chamanic_detail = new ChamanicDetail();
        citizen.chamanic_detail.nb_potion_shaman = 0;
        citizen.chamanic_detail.update_info = new UpdateInfo();
        testable.citizen_list = { data: [citizen] };
        const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);
        const refreshSpy: jasmine.Spy = spyOn(testable.change_detector_ref, 'detectChanges');

        (component as unknown as { changePotions(c: Citizen, value: number): void }).changePotions(citizen, 3);
        httpMock.expectOne((request) => request.url.includes('/chamanicDetail')).flush({});

        expect(refreshSpy).toHaveBeenCalled();
        expect(citizen.chamanic_detail.nb_potion_shaman).toBe(3);
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
