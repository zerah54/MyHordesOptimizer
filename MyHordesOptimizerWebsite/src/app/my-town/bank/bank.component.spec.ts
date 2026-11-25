import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import moment from 'moment';
import { of, Subject, throwError } from 'rxjs';

import { TownService } from '../../_abstract_model/services/town.service';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { BankVersion } from '../../_abstract_model/types/bank-version.class';
import { Category } from '../../_abstract_model/types/category.class';
import { Item } from '../../_abstract_model/types/item.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setTown } from '../../_core/utilities/localstorage.util';
import { BankComponent } from './bank.component';

describe('BankComponent', (): void => {
    let fixture: ComponentFixture<BankComponent>;
    let townService: TownService;

    afterEach((): void => setTown(null));

    function makeItem(id: number, label: string, ordering: number = 0): Item {
        const item: Item = new Item();
        item.id = id;
        item.category = Object.assign(new Category(), { id_category: ordering, ordering, label: { [moment.locale()]: 'Catégorie ' + ordering } });
        item.label = { [moment.locale()]: label };
        item.actions = [];
        item.properties = [];
        item.bank_count = 1;
        return item;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [BankComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();

        townService = TestBed.inject(TownService);
        fixture = TestBed.createComponent(BankComponent);
    });

    function flushBank(items: Item[]): void {
        const bank: BankInfo = new BankInfo();
        bank.items = items;
        vi.spyOn(townService, 'getBank').mockReturnValue(of(bank));
        fixture.detectChanges();
    }

    it('renders nothing until the bank has loaded', (): void => {
        vi.spyOn(townService, 'getBank').mockReturnValue(of());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-bank .filter')).toBeNull();
    });

    it('renders the bank items grouped by category once getBank() resolves', (): void => {
        flushBank([makeItem(1, 'Pelle'), makeItem(2, 'Pioche')]);

        const rendered_items: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('mho-item');
        expect(rendered_items.length).toBe(2);
    });

    it('applyFilters narrows displayed_bank_items by the typed filter text', (): void => {
        flushBank([makeItem(1, 'Pelle'), makeItem(2, 'Pioche')]);

        (fixture.componentInstance as unknown as {
            filter_value: string;
            applyFilters(): void;
        }).filter_value = 'pelle';
        (fixture.componentInstance as unknown as {
            applyFilters(): void;
        }).applyFilters();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mho-item').length).toBe(1);
    });

    interface BankInternals {
        filter_value: string;
        applyFilters(): void;
        selected_day(): number;
        selected_version_id(): number;
    }

    function makeVersion(day: number, last_update_id: number): BankVersion {
        return new BankVersion({ day, lastUpdateId: last_update_id, updateTime: '2026-11-21T10:00:00', userName: 'Zed' });
    }

    function bankOf(items: Item[]): BankInfo {
        const bank: BankInfo = new BankInfo();
        bank.items = items;
        return bank;
    }

    function open(versions: BankVersion[]): void {
        setTown(Object.assign(new TownDetails(), { town_id: 7, day: 3 }));
        vi.spyOn(townService, 'getBank').mockReturnValue(of(bankOf([makeItem(1, 'Pelle'), makeItem(2, 'Pioche')])));
        vi.spyOn(townService, 'getBankVersions').mockReturnValue(of(versions));
        fixture.detectChanges();
    }

    it('sans version : aucun sélecteur', (): void => {
        open([]);

        expect(fixture.nativeElement.querySelector('mho-day-selector')).toBeNull();
        expect(fixture.nativeElement.querySelector('mho-bank-version-selector')).toBeNull();
    });

    it('ouvre sur le dernier jour et la dernière version', (): void => {
        open([makeVersion(2, 10), makeVersion(3, 11), makeVersion(3, 12)]);
        const bank: BankInternals = fixture.componentInstance as unknown as BankInternals;

        expect(bank.selected_day()).toBe(3);
        expect(bank.selected_version_id()).toBe(12);
        expect(fixture.nativeElement.querySelector('mho-day-selector')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('mho-bank-version-selector')).not.toBeNull();
    });

    it('ouvre sur le jour du lien de la page (?day=) et le reprend dans l\'URL au changement de jour', async (): Promise<void> => {
        await TestBed.inject(Router).navigateByUrl('/?day=2');
        const get_version: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersion').mockReturnValue(of(bankOf([makeItem(1, 'Pelle')])));
        open([makeVersion(2, 10), makeVersion(2, 11), makeVersion(3, 12)]);
        const bank: BankInternals = fixture.componentInstance as unknown as BankInternals;

        expect(bank.selected_day()).toBe(2);
        expect(get_version).toHaveBeenCalledWith(7, 11);

        const navigate: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
        (fixture.componentInstance as unknown as { selectDay(day: number): void }).selectDay(3);
        expect(navigate.mock.lastCall?.[0].toString()).toBe('/?day=3');
    });

    it('le sélecteur de version est masqué sur un jour écoulé', (): void => {
        open([makeVersion(2, 10), makeVersion(2, 11), makeVersion(3, 12)]);
        vi.spyOn(townService, 'getBankVersion').mockReturnValue(of(bankOf([makeItem(1, 'Pelle')])));
        (fixture.componentInstance as unknown as { selectDay(day: number): void }).selectDay(2);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-bank-version-selector')).toBeNull();
    });

    it('changer de jour charge la dernière version de ce jour et garde les filtres', (): void => {
        open([makeVersion(2, 10), makeVersion(2, 11), makeVersion(3, 12)]);
        const get_version: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersion')
            .mockReturnValue(of(bankOf([makeItem(1, 'Pelle'), makeItem(2, 'Pioche')])));
        const bank: BankInternals = fixture.componentInstance as unknown as BankInternals;
        bank.filter_value = 'pelle';
        (fixture.componentInstance as unknown as { selectDay(day: number): void }).selectDay(2);
        fixture.detectChanges();

        expect(get_version).toHaveBeenCalledWith(7, 11);
        expect(fixture.nativeElement.querySelectorAll('mho-item').length).toBe(1);
    });

    it('une version disparue (404) ramène à la plus récente', (): void => {
        open([makeVersion(3, 11), makeVersion(3, 12)]);
        const get_version: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersion')
            .mockReturnValueOnce(throwError((): { status: number } => ({ status: 404 })))
            .mockReturnValue(of(bankOf([makeItem(1, 'Pelle')])));
        vi.spyOn(townService, 'getBankVersions').mockReturnValue(of([makeVersion(3, 12), makeVersion(3, 13)]));
        (fixture.componentInstance as unknown as { selectVersion(id: number): void }).selectVersion(11);
        fixture.detectChanges();

        expect(get_version).toHaveBeenLastCalledWith(7, 13);
        expect((fixture.componentInstance as unknown as BankInternals).selected_version_id()).toBe(13);
    });

    it('la demande la plus récente gagne quand les réponses arrivent inversées', (): void => {
        open([makeVersion(3, 11), makeVersion(3, 12)]);
        const slow: Subject<BankInfo> = new Subject<BankInfo>();
        const fast: Subject<BankInfo> = new Subject<BankInfo>();
        vi.spyOn(townService, 'getBankVersion').mockReturnValueOnce(slow).mockReturnValueOnce(fast);
        const bank: { selectVersion(id: number): void } = fixture.componentInstance as unknown as { selectVersion(id: number): void };
        bank.selectVersion(11);
        bank.selectVersion(12);
        fast.next(bankOf([makeItem(1, 'Pelle')]));
        slow.next(bankOf([makeItem(1, 'Pelle'), makeItem(2, 'Pioche')]));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mho-item').length).toBe(1);
    });

    it('404 avec liste rechargée vide : appels bornés et sélecteurs masqués', (): void => {
        open([makeVersion(3, 11), makeVersion(3, 12)]);
        const get_version: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersion')
            .mockReturnValue(throwError((): { status: number } => ({ status: 404 })));
        vi.spyOn(townService, 'getBankVersions').mockReturnValue(of([]));
        (fixture.componentInstance as unknown as { selectVersion(id: number): void }).selectVersion(11);
        fixture.detectChanges();

        expect(get_version).toHaveBeenCalledTimes(1);
        expect(fixture.nativeElement.querySelector('mho-day-selector')).toBeNull();
    });

    it('404 puis 404 sur la plus récente : un seul repli', (): void => {
        open([makeVersion(3, 11), makeVersion(3, 12)]);
        const get_version: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersion')
            .mockReturnValue(throwError((): { status: number } => ({ status: 404 })));
        vi.spyOn(townService, 'getBankVersions').mockReturnValue(of([makeVersion(3, 12), makeVersion(3, 13)]));
        (fixture.componentInstance as unknown as { selectVersion(id: number): void }).selectVersion(11);

        expect(get_version).toHaveBeenCalledTimes(2);
    });

    it('une erreur 500 sur une version remet la sélection sur la version affichée', (): void => {
        open([makeVersion(2, 10), makeVersion(3, 11), makeVersion(3, 12)]);
        vi.spyOn(townService, 'getBankVersion').mockReturnValue(throwError((): { status: number } => ({ status: 500 })));
        (fixture.componentInstance as unknown as { selectDay(day: number): void }).selectDay(2);
        const bank: BankInternals = fixture.componentInstance as unknown as BankInternals;

        expect(bank.selected_day()).toBe(3);
        expect(bank.selected_version_id()).toBe(12);
    });

    it('404 puis échec de la liste : une sélection ultérieure fonctionne encore', (): void => {
        open([makeVersion(3, 11), makeVersion(3, 12)]);
        const get_version: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersion')
            .mockReturnValueOnce(throwError((): { status: number } => ({ status: 404 })))
            .mockReturnValue(of(bankOf([makeItem(1, 'Pelle')])));
        vi.spyOn(townService, 'getBankVersions').mockReturnValue(throwError((): { status: number } => ({ status: 500 })));
        const bank: BankInternals & { selectVersion(id: number): void } = fixture.componentInstance as unknown as BankInternals & { selectVersion(id: number): void };
        bank.selectVersion(11);

        expect(bank.selected_version_id()).toBe(12);
        bank.selectVersion(11);
        fixture.detectChanges();

        expect(get_version).toHaveBeenLastCalledWith(7, 11);
        expect(bank.selected_version_id()).toBe(11);
        expect(fixture.nativeElement.querySelectorAll('mho-item').length).toBe(1);
    });

    it('à l ouverture, les versions ne sont demandées qu après la fin de getBank', (): void => {
        setTown(Object.assign(new TownDetails(), { town_id: 7, day: 3 }));
        const bank$: Subject<BankInfo> = new Subject<BankInfo>();
        vi.spyOn(townService, 'getBank').mockReturnValue(bank$);
        const get_versions: ReturnType<typeof vi.spyOn> = vi.spyOn(townService, 'getBankVersions').mockReturnValue(of([makeVersion(3, 12)]));
        fixture.detectChanges();

        expect(get_versions).not.toHaveBeenCalled();
        bank$.next(bankOf([makeItem(1, 'Pelle')]));

        expect(get_versions).toHaveBeenCalledTimes(1);
    });
});
