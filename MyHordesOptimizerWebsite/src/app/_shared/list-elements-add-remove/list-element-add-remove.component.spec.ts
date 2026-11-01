import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Property } from '../../_abstract_model/enum/property.enum';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { ListForAddRemove } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemsSortMode } from './items-sort-mode';
import { ListElementAddRemoveComponent } from './list-element-add-remove.component';
import { MenuAddComponent } from './menu-add/menu-add.component';
import { MenuRemoveComponent } from './menu-remove/menu-remove.component';

describe('ListElementAddRemoveComponent', (): void => {
    let fixture: ComponentFixture<ListElementAddRemoveComponent>;
    let locale: string;

    /** Objet minimal, id/label/actions/properties par défaut sans effet sur le calcul de PA. */
    function createItem(id: number, labelText: string = 'Objet'): Item {
        const item = new Item();
        item.id = id;
        item.uid = `item_${id}`;
        item.img = `item/item_${id}.gif`;
        item.label = { [locale]: labelText } as never;
        item.properties = [];
        item.actions = [];
        return item;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [ListElementAddRemoveComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
        fixture = TestBed.createComponent(ListElementAddRemoveComponent);
        locale = (fixture.componentInstance as unknown as {
            locale: string;
        }).locale;
    });

    /** Pose les entrées requises avec des valeurs neutres, complétées par `overrides`. */
    function setInputs(overrides: {
        currentList?: (Item | StatusEnum)[];
        lists?: ListForAddRemove[];
        label?: string;
        addLabel?: string;
        removeLabel?: string;
        emptyLabel?: string;
        readonly?: boolean;
        cls?: string;
    } = {}): void {
        fixture.componentRef.setInput('currentList', overrides.currentList ?? []);
        fixture.componentRef.setInput('lists', overrides.lists ?? []);
        fixture.componentRef.setInput('label', overrides.label ?? 'Sac');
        fixture.componentRef.setInput('addLabel', overrides.addLabel ?? 'Ajouter');
        fixture.componentRef.setInput('removeLabel', overrides.removeLabel ?? 'Retirer');
        fixture.componentRef.setInput('emptyLabel', overrides.emptyLabel ?? 'Vider');
        if (overrides.readonly !== undefined)
            fixture.componentRef.setInput('readonly', overrides.readonly);
        if (overrides.cls !== undefined)
            fixture.componentRef.setInput('class', overrides.cls);
    }

    it('renders one image per element of currentList, with its src and title', (): void => {
        const item = createItem(1, 'Bois');
        setInputs({ currentList: [item] });
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('.editable-container .list img')).nativeElement;
        expect(img.src).toContain(HORDES_IMG_REPO + item.img);
        expect(img.title).toBe('Bois');
    });

    it('renders no label block when label is empty', (): void => {
        setInputs({ label: '' });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.label'))).toBeNull();
    });

    it('renders the label text when label is non-empty', (): void => {
        setInputs({ label: 'Mon sac' });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.label')).nativeElement.textContent).toContain('Mon sac');
    });

    it('hides the AP-in-bag counter when currentList holds statuses instead of items', (): void => {
        setInputs({ currentList: [StatusEnum.TIRED] });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.count-ap-in-bag'))).toBeNull();
    });

    it('shows the AP-in-bag counter computed from countAvailableAp when currentList holds items', (): void => {
        const water = createItem(1, 'Eau');
        water.properties = [Property.IS_WATER];
        setInputs({ currentList: [water], lists: [{ label: 'Sac', list: [water] }] });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.count-ap-in-bag')).nativeElement.textContent).toContain('6');
    });

    it('hides the header add-remove controls when readonly is true', (): void => {
        setInputs({ label: 'Sac', readonly: true });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.label .add-remove'))).toBeNull();
    });

    it('shows the header add-remove controls (remove before add) when label is set and not readonly', (): void => {
        const item = createItem(1);
        setInputs({ label: 'Sac', currentList: [item], readonly: false });
        fixture.detectChanges();

        const triggers: HTMLImageElement[] = fixture.debugElement.queryAll(By.css('.label .add-remove img'))
            .map((debugElement) => debugElement.nativeElement as HTMLImageElement);
        expect(triggers.length).toBe(2);
        expect(triggers[0].src).toContain('small_less.gif');
        expect(triggers[1].src).toContain('small_more.gif');
    });

    it('shows the footer add-remove controls (add before remove) when label is empty and not readonly', (): void => {
        const item = createItem(1);
        setInputs({ label: '', currentList: [item], readonly: false });
        fixture.detectChanges();

        const triggers: HTMLImageElement[] = fixture.debugElement.queryAll(By.css('.editable-container .add-remove img'))
            .map((debugElement) => debugElement.nativeElement as HTMLImageElement);
        expect(triggers.length).toBe(2);
        expect(triggers[0].src).toContain('small_more.gif');
        expect(triggers[1].src).toContain('small_less.gif');
    });

    it('hides the footer add-remove controls when label is empty and readonly is true', (): void => {
        setInputs({ label: '', readonly: true });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.editable-container .add-remove'))).toBeNull();
    });

    it('hides the remove trigger when currentList is empty, but keeps the add trigger', (): void => {
        setInputs({ label: 'Sac', currentList: [], readonly: false });
        fixture.detectChanges();

        const triggers: HTMLImageElement[] = fixture.debugElement.queryAll(By.css('.label .add-remove img'))
            .map((debugElement) => debugElement.nativeElement as HTMLImageElement);
        expect(triggers.length).toBe(1);
        expect(triggers[0].src).toContain('small_more.gif');
    });

    it('wires the add trigger to menu-add\'s menu with the add label and lists', (): void => {
        const lists: ListForAddRemove[] = [{ label: 'Sac', list: [createItem(1)] }];
        setInputs({ label: 'Sac', addLabel: 'Ajouter un objet', lists });
        fixture.detectChanges();

        const addImg = fixture.debugElement.query(By.css('img[src*="small_more.gif"]'));
        const trigger: MatMenuTrigger = addImg.injector.get(MatMenuTrigger);
        const menuAdd: MenuAddComponent = fixture.debugElement.query(By.directive(MenuAddComponent)).componentInstance;
        expect(trigger.menu).toBe(menuAdd.menu());
        expect(trigger.menuData).toEqual({ menuLabel: 'Ajouter un objet', lists });
    });

    it('wires the remove trigger to menu-remove\'s menu with the remove label, list and empty label', (): void => {
        const item = createItem(1);
        setInputs({ label: 'Sac', currentList: [item], removeLabel: 'Retirer un objet', emptyLabel: 'Tout vider' });
        fixture.detectChanges();

        const removeImg = fixture.debugElement.query(By.css('img[src*="small_less.gif"]'));
        const trigger: MatMenuTrigger = removeImg.injector.get(MatMenuTrigger);
        const menuRemove: MenuRemoveComponent = fixture.debugElement.query(By.directive(MenuRemoveComponent)).componentInstance;
        expect(trigger.menu).toBe(menuRemove.menu());
        expect(trigger.menuData).toEqual({ menuLabel: 'Retirer un objet', list: [item], emptyLabel: 'Tout vider' });
    });

    it('forwards the class input to both menu-add and menu-remove', (): void => {
        setInputs({ cls: 'wishlist-menu' });
        fixture.detectChanges();

        const menuAdd: MenuAddComponent = fixture.debugElement.query(By.directive(MenuAddComponent)).componentInstance;
        const menuRemove: MenuRemoveComponent = fixture.debugElement.query(By.directive(MenuRemoveComponent)).componentInstance;
        expect(menuAdd.class()).toBe('wishlist-menu');
        expect(menuRemove.class()).toBe('wishlist-menu');
    });

    it('forwards keepOpen and the current lists to menu-add, for a quick add whose choices update while the menu stays open', (): void => {
        const lists: ListForAddRemove[] = [{ label: 'Sac', list: [createItem(1)] }];
        setInputs({ lists });
        fixture.componentRef.setInput('keepOpen', true);
        fixture.detectChanges();

        const menuAdd: MenuAddComponent = fixture.debugElement.query(By.directive(MenuAddComponent)).componentInstance;
        expect(menuAdd.keepOpen()).toBe(true);
        expect(menuAdd.lists()).toBe(lists);
    });

    it('does not keep menu-add open by default', (): void => {
        setInputs();
        fixture.detectChanges();

        const menuAdd: MenuAddComponent = fixture.debugElement.query(By.directive(MenuAddComponent)).componentInstance;
        expect(menuAdd.keepOpen()).toBe(false);
    });

    it('emits add when menu-add emits add', (): void => {
        setInputs();
        fixture.detectChanges();
        const emitted: (number | string)[] = [];
        fixture.componentInstance.add.subscribe((value: number | string) => emitted.push(value));

        const menuAdd: MenuAddComponent = fixture.debugElement.query(By.directive(MenuAddComponent)).componentInstance;
        menuAdd.add.emit(42);

        expect(emitted).toEqual([42]);
    });

    it('emits remove when menu-remove emits remove', (): void => {
        setInputs();
        fixture.detectChanges();
        const emitted: (number | string)[] = [];
        fixture.componentInstance.remove.subscribe((value: number | string) => emitted.push(value));

        const menuRemove: MenuRemoveComponent = fixture.debugElement.query(By.directive(MenuRemoveComponent)).componentInstance;
        menuRemove.remove.emit('item_1');

        expect(emitted).toEqual(['item_1']);
    });

    it('relaie le tri au menu d\'ajout, et son changement au parent', (): void => {
        const changes: ItemsSortMode[] = [];
        fixture.componentInstance.sortMode.subscribe((sort_mode: ItemsSortMode): number => changes.push(sort_mode));
        setInputs();
        fixture.componentRef.setInput('sortMode', 'quantity');
        fixture.detectChanges();
        const menuAdd: MenuAddComponent = fixture.debugElement.query(By.directive(MenuAddComponent)).componentInstance;
        expect(menuAdd.sortMode()).toBe('quantity');

        menuAdd.sortMode.set('category');
        fixture.detectChanges();

        expect(changes).toEqual(['category']);
    });

    describe('clic sur un élément de la liste', (): void => {
        let removed: (number | string)[];
        let added: (number | string)[];

        beforeEach((): void => {
            removed = [];
            added = [];
            fixture.componentInstance.remove.subscribe((value: number | string): number => removed.push(value));
            fixture.componentInstance.add.subscribe((value: number | string): number => added.push(value));
        });

        afterEach((): void => fixture.destroy());

        function listIcons(): HTMLImageElement[] {
            return Array.from(fixture.nativeElement.querySelectorAll('.editable-container .list img'));
        }

        function quantityValue(): string | undefined {
            return document.querySelector('.quantity-selector .quantity-value')?.textContent?.trim();
        }

        function quantityButton(icon: 'add' | 'remove'): HTMLButtonElement {
            return <HTMLButtonElement>Array.from(document.querySelectorAll<HTMLButtonElement>('.quantity-selector button'))
                .find((button: HTMLButtonElement): boolean => button.textContent?.trim() === icon);
        }

        it('retire l\'objet cliqué d\'une liste sans quantités', (): void => {
            setInputs({ currentList: [createItem(1, 'Bois'), createItem(2, 'Eau')] });
            fixture.detectChanges();

            listIcons()[1].click();

            expect(removed).toEqual([2]);
            expect(document.querySelector('.quantity-selector')).toBeNull();
        });

        it('retire un état cliqué par son identifiant', (): void => {
            setInputs({ currentList: [StatusEnum.TIRED] });
            fixture.detectChanges();

            listIcons()[0].click();

            expect(removed).toEqual([StatusEnum.TIRED.id]);
        });

        it('ne fait rien au clic en lecture seule', (): void => {
            setInputs({ currentList: [createItem(1, 'Bois')], readonly: true });
            fixture.detectChanges();

            listIcons()[0].click();

            expect(removed).toEqual([]);
        });

        it('ouvre le sélecteur de quantité d\'un objet d\'une liste à quantités, sans rien retirer', (): void => {
            const water: Item = createItem(1, 'Eau');
            setInputs({ currentList: [water, createItem(2, 'Bois'), water] });
            fixture.componentRef.setInput('withQuantity', true);
            fixture.detectChanges();

            listIcons()[2].click();
            fixture.detectChanges();

            expect(quantityValue()).toBe('2');
            expect(removed).toEqual([]);
        });

        it('ajoute et retire un exemplaire, et ferme le sélecteur au dernier retiré', (): void => {
            const water: Item = createItem(1, 'Eau');
            let bag: Item[] = [water, water];
            setInputs({ currentList: bag });
            fixture.componentRef.setInput('withQuantity', true);
            // Parent : un exemplaire ajouté en fin de sac, le premier trouvé retiré.
            fixture.componentInstance.add.subscribe((): void => {
                bag = [...bag, water];
                fixture.componentRef.setInput('currentList', bag);
            });
            fixture.componentInstance.remove.subscribe((item_id: number | string): void => {
                const index: number = bag.findIndex((item: Item): boolean => item.id === item_id);
                bag = bag.filter((_: Item, position: number): boolean => position !== index);
                fixture.componentRef.setInput('currentList', bag);
            });
            fixture.detectChanges();
            listIcons()[1].click();
            fixture.detectChanges();

            quantityButton('add').click();
            fixture.detectChanges();
            expect(quantityValue()).toBe('3');

            quantityButton('remove').click();
            fixture.detectChanges();
            quantityButton('remove').click();
            fixture.detectChanges();
            expect(quantityValue()).toBe('1');

            quantityButton('remove').click();
            fixture.detectChanges();

            expect(added).toEqual([1]);
            expect(removed).toEqual([1, 1, 1]);
            expect(document.querySelector('.quantity-selector')).toBeNull();
            expect(listIcons().length).toBe(0);
        });
    });

    it('emits empty when menu-remove emits empty', (): void => {
        setInputs();
        fixture.detectChanges();
        let emittedCount: number = 0;
        fixture.componentInstance.empty.subscribe(() => emittedCount++);

        const menuRemove: MenuRemoveComponent = fixture.debugElement.query(By.directive(MenuRemoveComponent)).componentInstance;
        menuRemove.empty.emit();

        expect(emittedCount).toBe(1);
    });
});
