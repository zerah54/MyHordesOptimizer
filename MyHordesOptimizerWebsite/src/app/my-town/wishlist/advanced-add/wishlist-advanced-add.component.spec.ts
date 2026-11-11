import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';

import { Action } from '../../../_abstract_model/enum/action.enum';
import { Item } from '../../../_abstract_model/types/item.class';
import { WishlistAdvancedAddComponent, WishlistAdvancedAddData, WishlistAdvancedAddResult } from './wishlist-advanced-add.component';

interface TestableComponent {
    name: WritableSignal<string>;
    count: WritableSignal<number>;
    zone: WritableSignal<number>;
    save_as_user_group: WritableSignal<boolean>;
    picking: WritableSignal<boolean>;
    selected_count(): number;
    to_add_count(): number;
    addCriterion(kind: 'action' | 'property' | 'category' | 'heavy'): void;
    setActionKeys(keys: string[]): void;
    removeCriterion(kind: 'action' | 'property' | 'category' | 'heavy'): void;
    action_keys: WritableSignal<string[]>;
    heavy: WritableSignal<boolean | null>;
    setHeavy(value: boolean | null): void;
    pick(item: Item): void;
    submit(): void;
}

function buildItem(id: number, actions: Action[], is_heaver: boolean): Item {
    return Object.assign(new Item(), { id, uid: `item_${id}_#00`, img: `item_${id}.gif`, label: {}, actions, properties: [], is_heaver, category: { id_category: 1 } });
}

describe('WishlistAdvancedAddComponent', (): void => {
    const items: Item[] = [
        buildItem(1, [Action.EAT_6AP], false),
        buildItem(2, [Action.EAT_7AP], false),
        buildItem(3, [Action.EAT_6AP], true),
        buildItem(4, [], false),
        buildItem(5, [Action.EAT_6AP], false)
    ];
    let fixture: ComponentFixture<WishlistAdvancedAddComponent>;
    let testable: TestableComponent;
    let close: Mock;

    async function create(overrides: Partial<WishlistAdvancedAddData> = {}): Promise<void> {
        const data: WishlistAdvancedAddData = { items, placedIdsInZone: (zone: number): ReadonlySet<number> => new Set(zone === 8 ? [5] : []), zone: 8, edit: null, ...overrides };
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [WishlistAdvancedAddComponent],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: { close } }]
        }).compileComponents();
        fixture = TestBed.createComponent(WishlistAdvancedAddComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.detectChanges();
    }

    function tiles(): HTMLElement[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.preview > .item-grid > .tile:not(.add-tile)'));
    }

    function submitButton(): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.submit')!;
    }

    describe('création', (): void => {
        beforeEach(async (): Promise<void> => {
            await create();
            testable.addCriterion('action');
            testable.setActionKeys(['eat_6ap', 'eat_7ap']);
            testable.addCriterion('heavy');
            testable.setHeavy(false);
            testable.name.set('Bouffe');
            fixture.detectChanges();
        });

        it('montre les objets correspondants et compte ceux qui seront ajoutés sans les placés', (): void => {
            expect(tiles().length).toBe(3);
            expect(testable.selected_count()).toBe(3);
            expect(testable.to_add_count()).toBe(2);
            expect(tiles().filter((tile: HTMLElement): boolean => tile.classList.contains('placed')).length).toBe(1);
        });

        it('exclut une tuile au premier clic et la remet au second', (): void => {
            tiles()[0].click();
            fixture.detectChanges();
            expect(tiles()[0].classList.contains('excluded')).toBe(true);
            expect(testable.to_add_count()).toBe(1);

            tiles()[0].click();
            fixture.detectChanges();
            expect(tiles()[0].classList.contains('excluded')).toBe(false);
            expect(testable.to_add_count()).toBe(2);
        });

        it('rend le résultat avec tous les objets retenus, la zone et le stock', (): void => {
            testable.zone.set(4);
            testable.count.set(10);
            testable.save_as_user_group.set(true);
            testable.submit();

            const expected: WishlistAdvancedAddResult = { name: 'Bouffe', item_ids: [1, 2, 5], count: 10, zone: 4, save_as_user_group: true };
            expect(close).toHaveBeenCalledWith(expected);
        });

        it('désactive la validation si le nom est vide', (): void => {
            testable.name.set('  ');
            fixture.detectChanges();
            expect(submitButton().disabled).toBe(true);
        });
    });

    it('ajoute un objet hors critères avec la tuile +, sans aucun critère', async (): Promise<void> => {
        await create();
        testable.name.set('Choix');
        fixture.detectChanges();
        expect(submitButton().disabled).toBe(true);

        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.add-tile')!.click();
        fixture.detectChanges();
        expect(testable.picking()).toBe(true);
        testable.pick(items[3]);
        fixture.detectChanges();

        expect(tiles().length).toBe(1);
        expect(testable.to_add_count()).toBe(1);
        expect(submitButton().disabled).toBe(false);
    });

    it('range les objets ajoutables par catégorie, dans l\'ordre des catégories', async (): Promise<void> => {
        const categorized: Item[] = [
            Object.assign(buildItem(10, [], false), { label: { fr: 'B' }, category: { id_category: 2, ordering: 2, label: { fr: 'Armes' } } }),
            Object.assign(buildItem(11, [], false), { label: { fr: 'A' }, category: { id_category: 1, ordering: 1, label: { fr: 'Provisions' } } }),
            Object.assign(buildItem(12, [], false), { label: { fr: 'C' }, category: { id_category: 2, ordering: 2, label: { fr: 'Armes' } } })
        ];
        await create({ items: categorized });
        testable.picking.set(true);
        fixture.detectChanges();

        const sections: HTMLElement[] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.picker .category'));
        expect(sections.map((section: HTMLElement): number => section.querySelectorAll('.tile').length)).toEqual([1, 2]);
        expect(sections.map((section: HTMLElement): string => section.querySelector('.category-label')!.textContent!.trim())).toEqual(['Provisions', 'Armes']);
    });

    it('désactive la validation si tous les objets retenus sont déjà placés sans groupe perso', async (): Promise<void> => {
        await create();
        testable.name.set('Déjà là');
        testable.pick(items[4]);
        fixture.detectChanges();

        expect(testable.to_add_count()).toBe(0);
        expect(submitButton().disabled).toBe(true);
    });

    it('recalcule le grisé et le compteur pour la zone saisie', async (): Promise<void> => {
        await create({ placedIdsInZone: (zone: number): ReadonlySet<number> => new Set(zone === 0 ? [1, 2, 3, 5] : []) });
        testable.addCriterion('action');
        testable.setActionKeys(['eat_6ap']);
        testable.name.set('B6');
        testable.zone.set(0);
        fixture.detectChanges();
        expect(testable.to_add_count()).toBe(0);
        expect(submitButton().disabled).toBe(true);

        testable.zone.set(5);
        fixture.detectChanges();

        expect(testable.to_add_count()).toBe(3);
        expect(tiles().some((tile: HTMLElement): boolean => tile.classList.contains('placed'))).toBe(false);
        expect(submitButton().disabled).toBe(false);
    });

    it('ne retire que les valeurs du critère supprimé', async (): Promise<void> => {
        await create();
        testable.addCriterion('action');
        testable.setActionKeys(['eat_6ap']);
        testable.addCriterion('heavy');
        testable.setHeavy(false);

        testable.removeCriterion('heavy');

        expect(testable.action_keys()).toEqual(['eat_6ap']);
        expect(testable.heavy()).toBeNull();
    });

    it('autorise l\'enregistrement du seul groupe perso quand tout est déjà placé', async (): Promise<void> => {
        await create();
        testable.name.set('Déjà là');
        testable.pick(items[4]);
        testable.save_as_user_group.set(true);
        fixture.detectChanges();

        expect(testable.to_add_count()).toBe(0);
        expect(submitButton().disabled).toBe(false);
    });

    it('désactive la validation quand le stock ou la zone est vidé', async (): Promise<void> => {
        await create();
        testable.name.set('Choix');
        testable.pick(items[3]);
        testable.count.set(null as unknown as number);
        fixture.detectChanges();
        expect(submitButton().disabled).toBe(true);

        testable.count.set(2);
        testable.zone.set(null as unknown as number);
        fixture.detectChanges();
        expect(submitButton().disabled).toBe(true);
    });


    it('saisit le stock comme dans la liste : case ∞ par défaut, champ numérique une fois décochée, icône ∞ pour revenir', async (): Promise<void> => {
        await create();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const countInput: () => HTMLInputElement | null = (): HTMLInputElement | null => root.querySelector<HTMLInputElement>('.count-field input');
        const infiniteBox: () => HTMLInputElement | null = (): HTMLInputElement | null => root.querySelector<HTMLInputElement>('.count-infinite input[type="checkbox"]');

        expect(countInput()).toBeNull();
        expect(infiniteBox()?.checked).toBe(true);

        infiniteBox()!.click();
        fixture.detectChanges();
        expect(testable.count()).toBe(1);
        expect(countInput()).not.toBeNull();

        root.querySelector<HTMLElement>('.count-field mat-icon')!.click();
        fixture.detectChanges();
        expect(testable.count()).toBe(-1);
        expect(countInput()).toBeNull();
    });

    it('saisit la zone comme dans la liste : champ numérique, icône ∞ pour passer en case cochée, décocher revient à 1', async (): Promise<void> => {
        await create();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const zoneInput: () => HTMLInputElement | null = (): HTMLInputElement | null => root.querySelector<HTMLInputElement>('.zone-field input');
        const infiniteBox: () => HTMLInputElement | null = (): HTMLInputElement | null => root.querySelector<HTMLInputElement>('.zone-infinite input[type="checkbox"]');

        expect(zoneInput()?.value).toBe('8');
        expect(infiniteBox()).toBeNull();

        root.querySelector<HTMLElement>('.zone-field mat-icon')!.click();
        fixture.detectChanges();
        expect(testable.zone()).toBe(0);
        expect(zoneInput()).toBeNull();
        expect(infiniteBox()?.checked).toBe(true);

        infiniteBox()!.click();
        fixture.detectChanges();
        expect(testable.zone()).toBe(1);
        expect(zoneInput()).not.toBeNull();
    });

    it("intitule le bouton « Ajouter M objets à la liste »", async (): Promise<void> => {
        await create();
        testable.pick(items[3]);
        fixture.detectChanges();

        expect(submitButton().textContent?.replace(/\s+/g, ' ').trim()).toBe('Ajouter 1 objets à la liste');
    });

    describe('modification', (): void => {
        beforeEach(async (): Promise<void> => {
            await create({ placedIdsInZone: (): ReadonlySet<number> => new Set([1]), edit: { name: 'Mon kit', item_uids: ['item_1_#00', 'item_4_#00'] } });
        });

        it('préremplit le nom et les objets, masque stock et zone, et ignore les objets placés', (): void => {
            expect(testable.name()).toBe('Mon kit');
            expect(tiles().length).toBe(2);
            expect(testable.to_add_count()).toBe(2);
            expect((fixture.nativeElement as HTMLElement).querySelector('.fields input[type="number"]')).toBeNull();
        });

        it('rend un résultat à enregistrer comme groupe perso', (): void => {
            testable.submit();
            expect(close).toHaveBeenCalledWith({ name: 'Mon kit', item_ids: [1, 4], count: -1, zone: 8, save_as_user_group: true });
        });
    });
});
