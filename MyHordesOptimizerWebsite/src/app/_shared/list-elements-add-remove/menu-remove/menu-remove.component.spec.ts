import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { Item } from '../../../_abstract_model/types/item.class';
import { MenuRemoveComponent } from './menu-remove.component';

/** Hôte minimal : reproduit le déclenchement `matMenuTriggerFor`/`matMenuTriggerData` réel de `list-element-add-remove`. */
@Component({
    imports: [MenuRemoveComponent, MatMenuModule],
    template: `
        <div class="opener" [matMenuTriggerFor]="menuRemove.menu()"
             [matMenuTriggerData]="{list: list, menuLabel: menuLabel, emptyLabel: emptyLabel}"></div>
        <mho-menu-remove #menuRemove="menuRemove" (remove)="removed.push($event)" (empty)="emptied = true"></mho-menu-remove>
    `
})
class MenuRemoveHostComponent {
    public list: (Item | StatusEnum)[] = [];
    public menuLabel: string = 'Retirer un objet';
    public emptyLabel: string = 'Tout vider';
    public removed: (number | string)[] = [];
    public emptied: boolean = false;
}

describe('MenuRemoveComponent', (): void => {
    let fixture: ComponentFixture<MenuRemoveHostComponent>;
    let locale: string;

    function createItem(id: number, labelText: string): Item {
        const item = new Item();
        item.id = id;
        item.uid = `item_${id}`;
        item.img = `item/item_${id}.gif`;
        item.label = { [locale]: labelText } as never;
        return item;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MenuRemoveHostComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(MenuRemoveHostComponent);
        const menuRemoveDebugElement = fixture.debugElement.query(By.directive(MenuRemoveComponent));
        locale = (menuRemoveDebugElement.componentInstance as unknown as { locale: string }).locale;
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
        fixture.componentInstance.menuLabel = 'Chercher';
        openMenu();

        const label: Element | null = document.querySelector('.mat-mdc-menu-panel mat-label');
        expect(label?.textContent).toContain('Chercher');
    });

    it('renders one image per list element, with its title', (): void => {
        fixture.componentInstance.list = [createItem(1, 'Pomme'), createItem(2, 'Poire')];
        openMenu();

        const titles: (string | null)[] = Array.from(document.querySelectorAll<HTMLImageElement>('.mat-mdc-menu-panel .items img'))
            .map((img: HTMLImageElement) => img.title);
        expect(titles).toEqual(['Pomme', 'Poire']);
    });

    it('emits remove with the item id when an item image is clicked', (): void => {
        fixture.componentInstance.list = [createItem(7, 'Pomme')];
        openMenu();

        const img: HTMLImageElement | null = document.querySelector<HTMLImageElement>('.mat-mdc-menu-panel .items img');
        img?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.removed).toEqual([7]);
    });

    it('filters items by the search term, case-insensitively', (): void => {
        fixture.componentInstance.list = [createItem(1, 'Pomme'), createItem(2, 'Poire')];
        openMenu();

        const search: HTMLInputElement = document.querySelector<HTMLInputElement>('.mat-mdc-menu-panel input[matInput]')!;
        search.value = 'poi';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const titles: (string | null)[] = Array.from(document.querySelectorAll<HTMLImageElement>('.mat-mdc-menu-panel .items img'))
            .map((img: HTMLImageElement) => img.title);
        expect(titles).toEqual(['Poire']);
    });

    it('shows the empty-bag entry with its label and icon', (): void => {
        fixture.componentInstance.emptyLabel = 'Vider le sac';
        openMenu();

        const emptyEntry: Element | null = document.querySelector('.mat-mdc-menu-panel .empty-bag');
        expect(emptyEntry?.textContent).toContain('Vider le sac');
        expect(emptyEntry?.querySelector('img')?.getAttribute('src')).toContain('b_close.png');
    });

    it('emits empty when the empty-bag entry is clicked', (): void => {
        openMenu();

        const emptyEntry: HTMLElement = document.querySelector<HTMLElement>('.mat-mdc-menu-panel .empty-bag')!;
        emptyEntry.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.emptied).toBeTrue();
    });

    it('renders StatusEnum elements the same way as items', (): void => {
        fixture.componentInstance.list = [StatusEnum.TIRED];
        openMenu();

        const img: HTMLImageElement | null = document.querySelector<HTMLImageElement>('.mat-mdc-menu-panel .items img');
        img?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.removed).toEqual([StatusEnum.TIRED.id]);
    });
});
