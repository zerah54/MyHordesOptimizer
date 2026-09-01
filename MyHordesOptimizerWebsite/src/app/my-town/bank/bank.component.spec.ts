import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import moment from 'moment';
import { of } from 'rxjs';

import { TownService } from '../../_abstract_model/services/town.service';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { Category } from '../../_abstract_model/types/category.class';
import { Item } from '../../_abstract_model/types/item.class';
import { BankComponent } from './bank.component';

describe('BankComponent', (): void => {
    let fixture: ComponentFixture<BankComponent>;
    let townService: TownService;

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
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();

        townService = TestBed.inject(TownService);
        fixture = TestBed.createComponent(BankComponent);
    });

    function flushBank(items: Item[]): void {
        const bank: BankInfo = new BankInfo();
        bank.items = items;
        spyOn(townService, 'getBank').and.returnValue(of(bank));
        fixture.detectChanges();
    }

    it('renders nothing until the bank has loaded', (): void => {
        spyOn(townService, 'getBank').and.returnValue(of());
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

        (fixture.componentInstance as unknown as { filter_value: string; applyFilters(): void }).filter_value = 'pelle';
        (fixture.componentInstance as unknown as { applyFilters(): void }).applyFilters();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mho-item').length).toBe(1);
    });
});
