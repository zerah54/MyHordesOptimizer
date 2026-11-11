import { ANIMATION_MODULE_TYPE, ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';

import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { AddMenuGroup, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Category } from '../../../_abstract_model/types/category.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { ItemsSortMode } from '../items-sort-mode';
import { MenuAddComponent } from './menu-add.component';

/** Hôte minimal : reproduit le déclenchement `matMenuTriggerFor`/`matMenuTriggerData` réel de `list-element-add-remove`. */
@Component({
    imports: [MenuAddComponent, MatMenuModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="opener" [matMenuTriggerFor]="menuAdd.menu()" [matMenuTriggerData]="{lists: lists, menuLabel: menuLabel}"></div>
        <mho-menu-add #menuAdd="menuAdd" [keepOpen]="keepOpen()" [lists]="inputLists()" [(sortMode)]="sortMode" [groups]="groups()" (add)="added.push($event)"
                      (addGroup)="addedGroups.push($event)" (advanced)="advancedCount = advancedCount + 1" (editGroup)="edited.push($event)" (deleteGroup)="deleted.push($event)"></mho-menu-add>
    `
})
class MenuAddHostComponent {
    public lists: ListForAddRemove[] = [];
    public inputLists: WritableSignal<ListForAddRemove[] | undefined> = signal(undefined);
    public keepOpen: WritableSignal<boolean> = signal(false);
    public sortMode: WritableSignal<ItemsSortMode> = signal('category');
    public menuLabel: string = 'Ajouter un objet';
    public added: (number | string)[] = [];
    public groups: WritableSignal<AddMenuGroup[] | undefined> = signal(undefined);
    public addedGroups: string[] = [];
    public advancedCount: number = 0;
    public edited: string[] = [];
    public deleted: string[] = [];
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
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
        fixture = TestBed.createComponent(MenuAddHostComponent);
        const menuAddDebugElement = fixture.debugElement.query(By.directive(MenuAddComponent));
        locale = (menuAddDebugElement.componentInstance as unknown as {
            locale: string;
        }).locale;
    });

    afterEach((): void => {
        fixture.destroy();
    });

    /** Déclencheur du mat-menu du composant testé. */
    function getTrigger(): MatMenuTrigger {
        return fixture.debugElement.query(By.directive(MatMenuTrigger)).injector.get(MatMenuTrigger);
    }

    /** Ouvre le mat-menu du composant testé et laisse le contenu (`matMenuContent`) se rendre dans l'overlay. */
    function openMenu(): void {
        fixture.detectChanges();
        getTrigger().openMenu();
        fixture.detectChanges();
    }

    /** Clique sur la première icône proposée par le menu ouvert. */
    function clickFirstItem(): void {
        document.querySelector<HTMLImageElement>('.mat-mdc-menu-panel .items img')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
    }

    /** Titres des icônes proposées par le menu ouvert. */
    function displayedTitles(): string[] {
        return Array.from(document.querySelectorAll<HTMLImageElement>('.mat-mdc-menu-panel .items img')).map((img: HTMLImageElement): string => img.title);
    }

    it('closes after an item is clicked by default', (): void => {
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(7, 'Pomme', createCategory(1, 0, 'Nourriture'))] }];
        openMenu();

        clickFirstItem();

        expect(getTrigger().menuOpen).toBe(false);
    });

    it('stays open after an item is clicked when keepOpen is set', (): void => {
        fixture.componentInstance.keepOpen.set(true);
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(7, 'Pomme', createCategory(1, 0, 'Nourriture'))] }];
        openMenu();

        clickFirstItem();

        expect(fixture.componentInstance.added).toEqual([7]);
        expect(getTrigger().menuOpen).toBe(true);
    });

    it('prefers the lists input over the menu context and follows its changes while open', (): void => {
        const category: Category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(9, 'Ignoré', category)] }];
        fixture.componentInstance.inputLists.set([{ label: 'Tous', list: [createItem(1, 'Pomme', category), createItem(2, 'Poire', category)] }]);
        openMenu();

        expect(displayedTitles()).toEqual(['Poire', 'Pomme']);

        fixture.componentInstance.inputLists.set([{ label: 'Tous', list: [createItem(2, 'Poire', category)] }]);
        fixture.detectChanges();

        expect(displayedTitles()).toEqual(['Poire']);
    });

    it('shows the search field label from the menu context', (): void => {
        fixture.componentInstance.menuLabel = 'Chercher un objet';
        openMenu();

        const label: Element | null = document.querySelector('.mat-mdc-menu-panel mat-label');
        expect(label?.textContent).toContain('Chercher un objet');
    });

    /** Segment du sélecteur de liste, repéré par son libellé. */
    function listButton(label: string): HTMLButtonElement {
        return <HTMLButtonElement>Array.from(document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel .lists button'))
            .find((button: HTMLButtonElement): boolean => button.textContent?.trim() === label);
    }

    it('renders items directly, without list selector, when a single list is provided', (): void => {
        const category: Category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(1, 'Pomme', category)] }];
        openMenu();

        expect(document.querySelector('.mat-mdc-menu-panel .lists')).toBeNull();
        expect(document.querySelectorAll('.mat-mdc-menu-panel .items img').length).toBe(1);
    });

    it('offers a segmented list selector, showing the first list, when several lists are provided', (): void => {
        const category: Category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [
            { label: 'Sac', list: [createItem(1, 'Pomme', category)] },
            { label: 'Coffre', list: [createItem(2, 'Poire', category)] }
        ];
        openMenu();

        const labels: (string | undefined)[] = Array.from(document.querySelectorAll('.mat-mdc-menu-panel .lists button'))
            .map((button: Element): string | undefined => button.textContent?.trim());
        expect(labels).toEqual(['Sac', 'Coffre']);
        expect(document.querySelector('mat-tab-group')).toBeNull();
        expect(displayedTitles()).toEqual(['Pomme']);
    });

    it('shows the chosen list, keeps the menu open, and reopens on it', (): void => {
        const category: Category = createCategory(1, 0, 'Nourriture');
        fixture.componentInstance.lists = [
            { label: 'Sac', list: [createItem(1, 'Pomme', category)] },
            { label: 'Coffre', list: [createItem(2, 'Poire', category)] }
        ];
        openMenu();

        listButton('Coffre').click();
        fixture.detectChanges();

        expect(getTrigger().menuOpen).toBe(true);
        expect(displayedTitles()).toEqual(['Poire']);

        getTrigger().closeMenu();
        fixture.detectChanges();
        openMenu();

        expect(displayedTitles()).toEqual(['Poire']);
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

    describe('avec des quantités', (): void => {
        function tileCount(title: string): string | undefined {
            return document.querySelector(`.mat-mdc-menu-panel img[title="${title}"]`)?.parentElement?.querySelector('.count')?.textContent?.trim();
        }

        function sortButton(label: string): HTMLButtonElement {
            return <HTMLButtonElement>Array.from(document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel .sort button'))
                .find((button: HTMLButtonElement): boolean => !!button.textContent?.includes(label));
        }

        it('ne propose ni quantités ni tri sans quantités fournies', (): void => {
            fixture.componentInstance.lists = [{ label: 'Sac', list: [createItem(1, 'Pomme', createCategory(1, 0, 'Nourriture'))] }];
            openMenu();

            expect(document.querySelector('.mat-mdc-menu-panel .sort')).toBeNull();
            expect(document.querySelector('.mat-mdc-menu-panel .count')).toBeNull();
        });

        it('montre la quantité des objets présents, rien pour les absents', (): void => {
            const category: Category = createCategory(1, 0, 'Nourriture');
            fixture.componentInstance.lists = [{
                label: 'Sac', list: [createItem(1, 'Pomme', category), createItem(2, 'Poire', category)], counts: new Map<number, number>([[1, 5]])
            }];
            openMenu();

            expect(tileCount('Pomme')).toBe('5');
            expect(tileCount('Poire')).toBeUndefined();
        });

        it('trie par quantité à la demande : les plus nombreux en tête, puis les absents par catégorie', (): void => {
            const food: Category = createCategory(1, 0, 'Nourriture');
            const resources: Category = createCategory(2, 1, 'Ressources');
            fixture.componentInstance.lists = [{
                label: 'Sac',
                list: [createItem(1, 'Pomme', food), createItem(2, 'Poire', food), createItem(3, 'Bois', resources), createItem(4, 'Ail', food), createItem(5, 'Fer', resources)],
                counts: new Map<number, number>([[3, 2], [2, 7]])
            }];
            openMenu();
            expect(displayedTitles()).toEqual(['Ail', 'Poire', 'Pomme', 'Bois', 'Fer']);

            sortButton('Par quantité').click();
            fixture.detectChanges();

            expect(getTrigger().menuOpen).toBe(true);
            expect(fixture.componentInstance.sortMode()).toBe('quantity');
            expect(displayedTitles()).toEqual(['Poire', 'Bois', 'Ail', 'Pomme', 'Fer']);
        });

        it('ouvre sur le tri reçu du parent', (): void => {
            const food: Category = createCategory(1, 0, 'Nourriture');
            fixture.componentInstance.sortMode.set('quantity');
            fixture.componentInstance.lists = [{
                label: 'Sac', list: [createItem(1, 'Pomme', food), createItem(2, 'Poire', food)], counts: new Map<number, number>([[1, 3], [2, 8]])
            }];
            openMenu();

            expect(displayedTitles()).toEqual(['Poire', 'Pomme']);
        });

        it('ne propose le tri que sur la liste qui fournit ses quantités', (): void => {
            const food: Category = createCategory(1, 0, 'Nourriture');
            fixture.componentInstance.lists = [
                { label: 'Banque', list: [createItem(1, 'Pomme', food)], counts: new Map<number, number>([[1, 3]]) },
                { label: 'Tous', list: [createItem(1, 'Pomme', food), createItem(2, 'Poire', food)] }
            ];
            openMenu();
            expect(document.querySelector('.mat-mdc-menu-panel .sort')).not.toBeNull();

            listButton('Tous').click();
            fixture.detectChanges();

            expect(document.querySelector('.mat-mdc-menu-panel .sort')).toBeNull();
            expect(displayedTitles()).toEqual(['Poire', 'Pomme']);
        });
    });

    it('emits add with the status id when a status image is clicked (flat view)', (): void => {
        fixture.componentInstance.lists = [{ label: 'Statuts', list: [StatusEnum.TIRED] }];
        openMenu();

        const img: HTMLImageElement | null = document.querySelector<HTMLImageElement>('.mat-mdc-menu-panel .items img');
        img?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.added).toEqual([StatusEnum.TIRED.id]);
    });

    describe('segment Groupes', (): void => {
        const category: Category = createCategory(1, 0, 'Nourriture');

        function group(key: string, label: string, ids: number[], placed: number[] = [], section: string = 'game', manageable: boolean = false): AddMenuGroup {
            return { key, label, section, manageable, items: ids.map((id: number): Item => createItem(id, `Objet ${id}`, category)), placed_item_ids: new Set(placed) };
        }

        function openGroups(groups: AddMenuGroup[]): void {
            fixture.componentInstance.inputLists.set([{ label: '', list: [createItem(1, 'Pomme', category)] }]);
            fixture.componentInstance.groups.set(groups);
            openMenu();
            Array.from(document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel .views button'))
                .find((button: HTMLButtonElement): boolean => button.textContent?.trim() === 'Groupes')?.click();
            fixture.detectChanges();
        }

        function lines(): HTMLElement[] {
            return Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel .gline'));
        }

        function lineNames(): string[] {
            return lines().map((line: HTMLElement): string => line.querySelector('.gname')!.firstChild!.textContent!.trim());
        }

        function search(text: string): void {
            const input: HTMLInputElement = document.querySelector<HTMLInputElement>('.mat-mdc-menu-panel input')!;
            input.value = text;
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();
        }

        /** Entrées actives du sous-menu ⋮ ouvert (le premier item, factice, est désactivé). */
        function manageEntries(): HTMLElement[] {
            return Array.from(document.querySelectorAll<HTMLElement>('.mho-menu-add-manage button[mat-menu-item]:not([disabled])'));
        }

        afterEach((): void => {
            document.querySelectorAll('.cdk-overlay-container').forEach((container: Element): void => { container.innerHTML = ''; });
        });

        it('n\'affiche pas le segment Objets | Groupes sans groups', (): void => {
            fixture.componentInstance.inputLists.set([{ label: '', list: [createItem(1, 'Pomme', category)] }]);
            openMenu();

            expect(document.querySelector('.mat-mdc-menu-panel .views')).toBeNull();
        });

        it('affiche le segment avec groups, les objets restant par défaut', (): void => {
            fixture.componentInstance.inputLists.set([{ label: '', list: [createItem(1, 'Pomme', category)] }]);
            fixture.componentInstance.groups.set([group('game:b6', 'B6', [1, 2])]);
            openMenu();

            expect(document.querySelector('.mat-mdc-menu-panel .views')).not.toBeNull();
            expect(displayedTitles()).toEqual(['Pomme']);
        });

        it('grise les objets placés et affiche le compteur 4/16', (): void => {
            const ids: number[] = Array.from({ length: 16 }, (_: unknown, index: number): number => index + 1);
            openGroups([group('game:b6', 'B6', ids, [1, 2, 3, 4])]);

            expect(lines()[0].querySelectorAll('.tile.placed').length).toBe(4);
            expect(lines()[0].querySelector('.warn')?.textContent).toContain('4/16');
        });

        it('émet addGroup au clic sur un groupe', (): void => {
            openGroups([group('game:b6', 'B6', [1, 2])]);

            lines()[0].click();

            expect(fixture.componentInstance.addedGroups).toEqual(['game:b6']);
        });

        it('n\'émet rien pour un groupe entièrement placé', (): void => {
            openGroups([group('game:b6', 'B6', [1, 2], [1, 2])]);

            lines()[0].click();

            expect(lines()[0].classList).toContain('full');
            expect(fixture.componentInstance.addedGroups).toEqual([]);
        });

        it('filtre par nom de groupe ou nom d\'objet', (): void => {
            openGroups([group('game:b6', 'B6', [1]), group('game:water', 'Eau', [2])]);

            search('eau');
            expect(lineNames()).toEqual(['Eau']);

            search('objet 1');
            expect(lineNames()).toEqual(['B6']);
        });

        it('affiche le ⋮ uniquement pour les groupes manageable', (): void => {
            openGroups([group('game:b6', 'B6', [1]), group('user:3', 'Kit', [2], [], 'user', true)]);

            expect(lines()[0].querySelector('.manage')).toBeNull();
            expect(lines()[1].querySelector('.manage')).not.toBeNull();
        });

        it('émet editGroup depuis le ⋮, sans ajouter le groupe', (): void => {
            openGroups([group('user:3', 'Kit', [2], [], 'user', true)]);

            lines()[0].querySelector<HTMLElement>('.manage')!.click();
            fixture.detectChanges();
            manageEntries()[0].click();

            expect(fixture.componentInstance.edited).toEqual(['user:3']);
            expect(fixture.componentInstance.addedGroups).toEqual([]);
        });

        it('émet deleteGroup depuis le ⋮', (): void => {
            openGroups([group('user:3', 'Kit', [2], [], 'user', true)]);

            lines()[0].querySelector<HTMLElement>('.manage')!.click();
            fixture.detectChanges();
            manageEntries()[1].click();

            expect(fixture.componentInstance.deleted).toEqual(['user:3']);
        });

        it('émet advanced au clic sur « Ajout avancé… »', (): void => {
            openGroups([group('game:b6', 'B6', [1])]);

            document.querySelector<HTMLElement>('.mat-mdc-menu-panel .adv')!.click();

            expect(fixture.componentInstance.advancedCount).toBe(1);
        });
    });
});
