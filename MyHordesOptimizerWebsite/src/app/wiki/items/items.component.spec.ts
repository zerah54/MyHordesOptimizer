import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import moment from 'moment';
import { Subject } from 'rxjs';

import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Category } from '../../_abstract_model/types/category.class';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemsComponent } from './items.component';

describe('ItemsComponent', (): void => {
    let fixture: ComponentFixture<ItemsComponent>;
    let component: ItemsComponent;
    let items_subject: Subject<Item[]>;

    function makeItem(id: number, label: string, ordering: number, properties: Property[] = [], actions: Action[] = []): Item {
        const item: Item = new Item();
        item.id = id;
        item.label = { [moment.locale()]: label };
        item.category = Object.assign(new Category(), { id_category: ordering, ordering, label: { [moment.locale()]: 'Catégorie ' + ordering } });
        item.properties = properties;
        item.actions = actions;
        return item;
    }

    beforeEach(async (): Promise<void> => {
        items_subject = new Subject<Item[]>();
        await TestBed.configureTestingModule({
            imports: [ItemsComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideNoopAnimations(),
                { provide: ApiService, useValue: { getItems: (): unknown => items_subject.asObservable() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ItemsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders nothing until the items have arrived', (): void => {
        expect(fixture.debugElement.query(By.css('.mho-items ul'))).toBeNull();
    });

    it('renders the items sorted into their category once the API responds', (): void => {
        items_subject.next([
            makeItem(1, 'Pioche', 2),
            makeItem(2, 'Pain', 1),
            makeItem(3, 'Conserve', 1)
        ]);
        fixture.detectChanges();

        const category_headers = fixture.debugElement.queryAll(By.css('.category h2'));
        expect(category_headers.length).toBe(2);
        expect(category_headers[0].nativeElement.textContent).toBe('Catégorie 1');
        expect(category_headers[1].nativeElement.textContent).toBe('Catégorie 2');
        expect(fixture.debugElement.queryAll(By.css('mho-item')).length).toBe(3);
    });

    it('applyFilters narrows displayed_items by label text', (): void => {
        items_subject.next([makeItem(1, 'Pioche', 1), makeItem(2, 'Pain', 1)]);
        fixture.detectChanges();

        component['filter_value'] = 'pio';
        component['applyFilters']();
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('mho-item')).length).toBe(1);
    });

    it('applyFilters narrows displayed_items by selected property/action', (): void => {
        items_subject.next([
            makeItem(1, 'Pioche', 1, [Property.LOCK]),
            makeItem(2, 'Pain', 1, [])
        ]);
        fixture.detectChanges();

        component['select_value'] = [Property.LOCK];
        component['applyFilters']();
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('mho-item')).length).toBe(1);
    });

    it('applyFilters with no active filter restores the full item list', (): void => {
        items_subject.next([makeItem(1, 'Pioche', 1), makeItem(2, 'Pain', 1)]);
        fixture.detectChanges();

        component['filter_value'] = 'pio';
        component['applyFilters']();
        component['filter_value'] = '';
        component['applyFilters']();
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('mho-item')).length).toBe(2);
    });
});
