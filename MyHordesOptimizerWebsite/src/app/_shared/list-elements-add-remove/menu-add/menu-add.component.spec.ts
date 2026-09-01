import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Category } from '../../../_abstract_model/types/category.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MenuAddComponent } from './menu-add.component';

/** Hôte minimal : reproduit le déclenchement `matMenuTriggerFor`/`matMenuTriggerData` réel de `list-element-add-remove`. */
@Component({
    imports: [MenuAddComponent, MatMenuModule],
    template: `
        <div class="opener" [matMenuTriggerFor]="menuAdd.menu()" [matMenuTriggerData]="{lists: lists, menuLabel: menuLabel}"></div>
        <mho-menu-add #menuAdd="menuAdd" (add)="added.push($event)"></mho-menu-add>
    `
})
class MenuAddHostComponent {
    public lists: ListForAddRemove[] = [];
    public menuLabel: string = 'Ajouter un objet';
    public added: (number | string)[] = [];
}

describe('MenuAddComponent', (): void => {
    let fixture: ComponentFixture<MenuAddHostComponent>;
    let locale: string;

    function createCategory(id: number, order: number, labelText: string): Category {
        const category = new Category();
        category.id_category = id;
        category.ordering = order;
        category.label = { [locale]: labelText } as never;
        return category;
    }

    function createItem(id: number, labelText: string, category: Category): Item {
        const item = new Item();
        item.id = id;
        item.uid = `item_${id}`;
        item.img = `item/item_${id}.gif`;
        item.label = { [locale]: labelText } as never;
        item.category = category;
        return item;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MenuAddHostComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(MenuAddHostComponent);
        const menuAddDebugElement = fixture.debugElement.query(By.directive(MenuAddComponent));
        locale = (menuAddDebugElement.componentInstance as unknown as { locale: string }).locale;
    });

    afterEach((): void => {
        fixture.destroy();
    });

    /** Ouvre le mat-menu du composant testé et laisse le contenu (`matMenuContent`) se rendre dans l'overlay. */
    function openMenu(): void {
        fixture.detectChanges();
        const trigger: MatMenuTrigger = fixture.debugElement.query(By.directive(MatMenuTrigger)).injector.get(MatMenuTrigger);
        trigger.openMenu();
        fixture.detectChanges();
    }

    it('shows the search field label from the menu context', (): void => {
        fixture.componentInstance.menuLabel = 'Chercher un objet';
        openMenu();

        const label: Element | null = document.querySelector('.mat-mdc-menu-panel mat-label');
        expect(label?.textContent).toContain('Chercher un objet');
    });

    it('renders items directly (no tabs) when a single list is provided', (): void => {
        const category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(1, 'Pomme', category)] }];
        openMenu();

        expect(document.querySelector('mat-tab-group')).toBeNull();
        expect(document.querySelectorAll('.mat-mdc-menu-panel .items img').length).toBe(1);
    });

    it('renders one tab per list when several lists are provided', (): void => {
        const category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [
            { label: 'Sac', list: [createItem(1, 'Pomme', category)] },
            { label: 'Coffre', list: [createItem(2, 'Poire', category)] }
        ];
        openMenu();

        expect(document.querySelector('mat-tab-group')).toBeTruthy();
        const tabLabels: (string | undefined)[] = Array.from(document.querySelectorAll('.mdc-tab__text-label'))
            .map((el: Element) => el.textContent?.trim());
        expect(tabLabels).toEqual(['Sac', 'Coffre']);
    });

    it('groups items by category, showing the category label, when the list holds Item instances', (): void => {
        const category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(1, 'Pomme', category)] }];
        openMenu();

        expect(document.querySelector('.mat-mdc-menu-panel .items')?.textContent).toContain('Nourriture');
    });

    it('emits add with the item id when an item image is clicked (grouped view)', (): void => {
        const category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(7, 'Pomme', category)] }];
        openMenu();

        const img: HTMLImageElement | null = document.querySelector<HTMLImageElement>('.mat-mdc-menu-panel .items img');
        img?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.added).toEqual([7]);
    });

    it('filters items by the search term, case-insensitively', (): void => {
        const category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(1, 'Pomme', category), createItem(2, 'Poire', category)] }];
        openMenu();

        const search: HTMLInputElement = document.querySelector<HTMLInputElement>('.mat-mdc-menu-panel input[matInput]')!;
        search.value = 'POM';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const titles: (string | null)[] = Array.from(document.querySelectorAll<HTMLImageElement>('.mat-mdc-menu-panel .items img'))
            .map((img: HTMLImageElement) => img.title);
        expect(titles).toEqual(['Pomme']);
    });

    it('renders items directly, without category grouping, when the list holds no Item instances', (): void => {
        fixture.componentInstance.lists = [{ label: 'Statuts', list: [StatusEnum.TIRED] }];
        openMenu();

        expect(document.querySelectorAll('.mat-mdc-menu-panel .items img').length).toBe(1);
        expect(document.querySelector('.mat-mdc-menu-panel .items')?.textContent?.trim()).toBe('');
    });

    it('emits add with the status id when a status image is clicked (flat view)', (): void => {
        fixture.componentInstance.lists = [{ label: 'Statuts', list: [StatusEnum.TIRED] }];
        openMenu();

        const img: HTMLImageElement | null = document.querySelector<HTMLImageElement>('.mat-mdc-menu-panel .items img');
        img?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.added).toEqual([StatusEnum.TIRED.id]);
    });
});
