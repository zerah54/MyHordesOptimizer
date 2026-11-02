import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { CitizenFilterSortStore } from '../citizen-filter-sort.store';
import { HOUSE_DEFENSE_ID } from '../citizen-filter-sort.util';
import { CitizenSortButtonComponent } from './citizen-sort-button.component';

describe('CitizenSortButtonComponent', (): void => {
    let fixture: ComponentFixture<CitizenSortButtonComponent>;
    let store: CitizenFilterSortStore;

    beforeEach(async (): Promise<void> => {
        store = new CitizenFilterSortStore();
        await TestBed.configureTestingModule({
            imports: [CitizenSortButtonComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: CitizenFilterSortStore, useValue: store }]
        }).compileComponents();
        fixture = TestBed.createComponent(CitizenSortButtonComponent);
        fixture.componentRef.setInput('daily_actions', [DailyActionEnum.HOME_POOL]);
        fixture.detectChanges();
    });

    function button(): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="sort-citizens"]') as HTMLButtonElement;
    }

    it('choisir un champ trie par ce champ et l\'affiche sur le bouton', (): void => {
        expect(button().textContent).toContain('Trier par');
        button().click();
        fixture.detectChanges();

        document.querySelector<HTMLButtonElement>(`.mat-mdc-menu-panel button[data-sort="${HOUSE_DEFENSE_ID}"]`)?.click();
        fixture.detectChanges();

        expect(store.sort_field()).toBe(HOUSE_DEFENSE_ID);
        expect(button().textContent).toContain('Défense de la maison');
    });
});
