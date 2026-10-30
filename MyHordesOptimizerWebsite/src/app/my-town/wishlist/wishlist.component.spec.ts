import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement, EventEmitter, WritableSignal } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import type { MockInstance } from 'vitest';

import { WishlistInfoDTO } from '../../_abstract_model/dto/wishlist-info.dto';
import { WishlistItemDTO } from '../../_abstract_model/dto/wishlist-item.dto';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { ListForAddRemove } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { DeferredCellComponent } from '../../_shared/deferred-cell/deferred-cell.component';
import { WishlistComponent } from './wishlist.component';

interface TestableComponent {
    wishlist_info: WritableSignal<WishlistInfo | null>;
    edition_mode: WritableSignal<boolean>;
    datasource: MatTableDataSource<WishlistItem>;
    items: WritableSignal<Item[]>;
    current_zone_xp_pa_add_item: WritableSignal<number>;
    add_lists(): ListForAddRemove[];
    selected(): Set<string>;
    wishlist_filters_change: EventEmitter<void>;
    addItemToWishlist(item_id: number): void;
    sortWishlist(event: CdkDragDrop<MatTableDataSource<WishlistItem>>): void;
    unsaved_duplicates(): string[];
    auto_save$: Subject<WishlistInfo>;
    triggerSave(): void;
    buildExcelRows(items: WishlistItem[]): Record<string, string | number>[];
}

function buildItemDto(overrides: Partial<WishlistItemDTO['item']> = {}): WishlistItemDTO['item'] {
    return {
        uid: 'planche_tordue_#00', img: '', imgBroken: null, label: {}, description: {},
        id: 1, category: { idCategory: 1, name: 'Box', label: {}, ordering: 0 },
        deco: 0, isHeaver: false, guard: 0,
        properties: [], actions: [], recipes: [],
        openedWith: null, opens: [],
        openApCost: null, openSuccessRate: null, technicianOpenCpCost: null,
        catapultEffect: null,
        bankCount: 0, wishListCount: 0, dropRateNotPraf: 0, dropRatePraf: 0,
        ...overrides
    };
}

/** Reproduit le DTO tel que renvoyé par une API pas encore reconstruite avec les champs coffre/carte. */
function buildDtoWithoutChestAndMapFields(): WishlistItemDTO {
    const dto: Partial<WishlistItemDTO> = {
        count: 103, bankCount: 103, bagCount: 13, bagCitizens: [],
        item: buildItemDto(), priority: 0, depot: 0, shouldSignal: false, zoneXPa: 0
    };
    return dto as WishlistItemDTO;
}

/** Ligne de liste pour l'objet `id`, dans la zone `zone_x_pa`, avec la quantité souhaitée `count`. */
function buildRowDto(id: number, zone_x_pa: number, count: number): WishlistItemDTO {
    const label: string = `Objet ${id}`;
    return {
        count, bankCount: 0, bagCount: 0, bagCitizens: [], chestCount: 0, chestCitizens: [], mapCellItemCount: 0,
        item: buildItemDto({ id, label: { fr: label, en: label, de: label, es: label }, wishListCount: 99 }),
        priority: 0, depot: 0, shouldSignal: false, zoneXPa: zone_x_pa
    };
}

describe('WishlistComponent', (): void => {
    let fixture: ComponentFixture<WishlistComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [WishlistComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
            deferBlockBehavior: DeferBlockBehavior.Manual
        }).compileComponents();

        fixture = TestBed.createComponent(WishlistComponent);
    });

    it('ne plante pas et garde le nombre de cellules aligné sur les en-têtes quand l\'API ne renvoie pas encore chestCount/mapCellItemCount', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        const dto: WishlistInfoDTO = { wishList: [buildDtoWithoutChestAndMapFields()], lastUpdateInfo: null };

        expect(() => {
            testable.wishlist_info.set(new WishlistInfo(dto));
            fixture.detectChanges();
        }).not.toThrow();

        const columnClass = (cell: HTMLElement): string => Array.from(cell.classList).find((c: string) => c.startsWith('mat-column-')) ?? '';
        const header_ids: string[] = Array.from(fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>).map(columnClass);
        const row_ids: string[] = Array.from(fixture.nativeElement.querySelectorAll('tbody tr:first-child td') as NodeListOf<HTMLElement>).map(columnClass);

        expect(row_ids).toEqual(header_ids);
    });

    it('exporte la quantité souhaitée de chaque ligne, pas le wishlist_count de l\'objet', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        const info: WishlistInfo = new WishlistInfo({ wishList: [buildRowDto(1, 0, 5), buildRowDto(1, 3, 2)], lastUpdateInfo: null });

        const quantities: (string | number)[] = testable.buildExcelRows(info.wishlist_items)
            .map((row: Record<string, string | number>): string | number => row['Quantité souhaitée']);

        expect(quantities).toEqual([5, 2]);
    });

    it('suspend l\'enregistrement et le signale tant qu\'un objet figure deux fois dans la même zone', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        testable.wishlist_info.set(new WishlistInfo({
            wishList: [buildRowDto(1, 3, 5), buildRowDto(1, 3, 2), buildRowDto(2, 3, 1)],
            lastUpdateInfo: null
        }));
        const next_spy: MockInstance<(value: WishlistInfo) => void> = vi.spyOn(testable.auto_save$, 'next');

        testable.triggerSave();
        fixture.detectChanges();

        expect(next_spy).not.toHaveBeenCalled();
        expect(testable.unsaved_duplicates()).toEqual(['Objet 1']);
        const warning: HTMLElement | null = fixture.nativeElement.querySelector('.duplicate-warning[role="alert"]');
        expect(warning?.textContent).toContain('Objet 1');

        (testable.wishlist_info() as WishlistInfo).wishlist_items[1].zone_x_pa = 4;
        testable.triggerSave();
        fixture.detectChanges();

        expect(next_spy).toHaveBeenCalledTimes(1);
        expect(testable.unsaved_duplicates()).toEqual([]);
        expect(fixture.nativeElement.querySelector('.duplicate-warning')).toBeNull();
    });

    it('active le glisser-déposer dès l\'affichage en mode édition, sans attendre d\'interaction', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        testable.edition_mode.set(true);
        testable.wishlist_info.set(new WishlistInfo({ wishList: [buildRowDto(1, 0, 5), buildRowDto(2, 0, 1)], lastUpdateInfo: null }));
        fixture.detectChanges();

        const drop_list: CdkDropList = fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);
        expect(drop_list.disabled).toBe(false);

        testable.edition_mode.set(false);
        fixture.detectChanges();

        expect(drop_list.disabled).toBe(true);
    });

    it('place l\'objet déposé à la position visée dans la liste filtrée', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        testable.wishlist_info.set(new WishlistInfo({
            wishList: [buildRowDto(1, 0, 1), buildRowDto(2, 0, 1), buildRowDto(11, 0, 1), buildRowDto(3, 0, 1)],
            lastUpdateInfo: null
        }));
        fixture.detectChanges();
        testable.datasource.filter = JSON.stringify({ items: 'Objet 1', depot: [] });
        const dragged: WishlistItem = (testable.wishlist_info() as WishlistInfo).wishlist_items[0];

        testable.sortWishlist({ item: { data: dragged }, previousIndex: 0, currentIndex: 1 } as unknown as CdkDragDrop<MatTableDataSource<WishlistItem>>);

        const ids: number[] = (testable.wishlist_info() as WishlistInfo).wishlist_items.map((row: WishlistItem): number => row.item.id);
        expect(ids).toEqual([2, 11, 1, 3]);
    });

    describe('sélection multiple', (): void => {
        let testable: TestableComponent;

        /** Lignes de la liste, dans l'ordre. */
        function rows(): WishlistItem[] {
            return (testable.wishlist_info() as WishlistInfo).wishlist_items;
        }

        /** Identifiants des objets de la liste, dans l'ordre. */
        function rowIds(): number[] {
            return rows().map((row: WishlistItem): number => row.item.id);
        }

        /** Identifiants des objets sélectionnés, triés. */
        function selectedIds(): number[] {
            return [...testable.selected()].map((key: string): number => +key.split('_')[0]).sort((a: number, b: number): number => a - b);
        }

        /** Clique sur la case de sélection de la ligne affichée à l'index donné. */
        function clickSelectBox(row_index: number, shift: boolean = false): void {
            const inputs: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('td.mat-column-select input[type="checkbox"]');
            inputs[row_index].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: shift }));
            fixture.detectChanges();
        }

        /** Simule le dépôt de la ligne `row` glissée de `previous_index` à `current_index` (index affichés). */
        function drop(row: WishlistItem, previous_index: number, current_index: number): void {
            testable.sortWishlist({ item: { data: row }, previousIndex: previous_index, currentIndex: current_index } as unknown as CdkDragDrop<MatTableDataSource<WishlistItem>>);
        }

        beforeEach(async (): Promise<void> => {
            testable = fixture.componentInstance as unknown as TestableComponent;
            testable.edition_mode.set(true);
            testable.wishlist_info.set(new WishlistInfo({ wishList: [1, 2, 3, 4, 5].map((id: number): WishlistItemDTO => buildRowDto(id, 0, 1)), lastUpdateInfo: null }));
            fixture.detectChanges();
            for (const block of await fixture.getDeferBlocks()) {
                await block.render(DeferBlockState.Complete);
            }
            fixture.detectChanges();
        });

        it('déclare la zone qui défile au drag & drop, pour qu\'elle défile quand on approche du bord', (): void => {
            const scrollable: DebugElement | null = fixture.debugElement.query(By.directive(CdkScrollable));
            expect(scrollable?.nativeElement.contains(fixture.nativeElement.querySelector('table'))).toBe(true);
            expect(scrollable?.nativeElement.classList).toContain('mat-elevation-z8');
        });

        it('rend toutes les cellules en mode édition, pour que les lignes ne changent plus de hauteur pendant un drag', (): void => {
            const eagerFlags: () => boolean[] = (): boolean[] => fixture.debugElement.queryAll(By.directive(DeferredCellComponent))
                .map((cell: DebugElement): boolean => cell.injector.get(DeferredCellComponent).eager());

            expect(eagerFlags().length).toBeGreaterThan(0);
            expect(eagerFlags().every((eager: boolean): boolean => eager)).toBe(true);

            testable.edition_mode.set(false);
            fixture.detectChanges();

            expect(eagerFlags().some((eager: boolean): boolean => eager)).toBe(false);
        });

        it('place l\'aperçu de drag dans le tableau, pour qu\'il garde les styles du composant', (): void => {
            const containers: unknown[] = fixture.debugElement.queryAll(By.directive(CdkDrag))
                .map((element: DebugElement): unknown => element.injector.get(CdkDrag).previewContainer);

            expect(containers.length).toBeGreaterThan(0);
            expect(containers.every((container: unknown): boolean => container === 'parent')).toBe(true);
        });

        it('coche puis décoche une plage avec Maj + clic, dans l\'ordre affiché', (): void => {
            clickSelectBox(1);
            clickSelectBox(3, true);

            expect(selectedIds()).toEqual([2, 3, 4]);

            clickSelectBox(2, true);

            expect(selectedIds()).toEqual([2]);
        });

        it('ignore un clic à côté de la case', (): void => {
            clickSelectBox(0);
            const box: HTMLElement = fixture.nativeElement.querySelectorAll('td.mat-column-select mat-checkbox')[3];
            box.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));

            expect(selectedIds()).toEqual([1]);
        });

        it('déplace toute la sélection, regroupée dans son ordre, à l\'endroit du dépôt vers le bas, puis la vide', (): void => {
            clickSelectBox(0);
            clickSelectBox(2);

            drop(rows()[0], 0, 3);

            expect(rowIds()).toEqual([2, 4, 1, 3, 5]);
            expect(selectedIds()).toEqual([]);
        });

        it('déplace toute la sélection à l\'endroit du dépôt vers le haut', (): void => {
            clickSelectBox(3);
            clickSelectBox(4);

            drop(rows()[4], 4, 1);

            expect(rowIds()).toEqual([1, 4, 5, 2, 3]);
        });

        it('regroupe une sélection éparpillée autour de la ligne déposée sur place', (): void => {
            clickSelectBox(0);
            clickSelectBox(3);

            drop(rows()[0], 0, 0);

            expect(rowIds()).toEqual([1, 4, 2, 3, 5]);
        });

        it('déplace seule une ligne non cochée et conserve la sélection', (): void => {
            clickSelectBox(2);

            drop(rows()[0], 0, 2);

            expect(rowIds()).toEqual([2, 3, 1, 4, 5]);
            expect(selectedIds()).toEqual([3]);
        });

        it('vide la sélection quand le filtre change', (): void => {
            clickSelectBox(1);

            testable.wishlist_filters_change.emit();

            expect(selectedIds()).toEqual([]);
        });

        it('affiche un aperçu groupé seulement quand plusieurs lignes sont sélectionnées', (): void => {
            /** Lignes dont le drag utilisera l'aperçu groupé (aperçu déclaré dans le contenu non projeté du `tr`). */
            const rowsWithGroupedPreview: () => number[] = (): number[] => fixture.debugElement.queryAll(By.directive(CdkDrag))
                .map((element: DebugElement): CdkDrag => element.injector.get(CdkDrag))
                .filter((drag: CdkDrag): boolean => (drag as unknown as { _previewTemplate: CdkDragPreview | null })._previewTemplate !== null)
                .map((drag: CdkDrag): number => (drag.data as WishlistItem).item.id);
            clickSelectBox(0);

            expect(rowsWithGroupedPreview()).toEqual([]);

            clickSelectBox(2);

            expect(rowsWithGroupedPreview()).toEqual([1, 3]);
        });
    });

    describe('menu d\'ajout', (): void => {
        let testable: TestableComponent;
        let wishlist_service: WishlistService;

        /** Identifiants des objets proposés par le menu d'ajout. */
        function proposedIds(): number[] {
            return testable.add_lists()[0].list.map((item: Item | StatusEnum): number => (item as Item).id);
        }

        beforeEach((): void => {
            testable = fixture.componentInstance as unknown as TestableComponent;
            wishlist_service = TestBed.inject(WishlistService);
            testable.edition_mode.set(true);
            fixture.detectChanges();
            testable.items.set([1, 2, 3].map((id: number): Item => new Item(buildItemDto({ id }))));
            testable.wishlist_info.set(new WishlistInfo({ wishList: [buildRowDto(1, 0, 1), buildRowDto(2, 4, 1)], lastUpdateInfo: null }));
            fixture.detectChanges();
        });

        it('s\'ouvre depuis un bouton « Ajouter à la liste de courses »', (): void => {
            const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.table-headers button'));
            expect(buttons.some((button: HTMLButtonElement): boolean => button.textContent?.includes('Ajouter à la liste de courses') ?? false)).toBe(true);
        });

        it('ne propose que les objets absents de la zone choisie', (): void => {
            expect(proposedIds()).toEqual([2, 3]);

            testable.current_zone_xp_pa_add_item.set(4);

            expect(proposedIds()).toEqual([1, 3]);
        });

        it('masque l\'objet dès le clic, avant même la réponse de l\'API', (): void => {
            const add_spy: MockInstance<WishlistService['addItemToWishlist']> = vi.spyOn(wishlist_service, 'addItemToWishlist').mockReturnValue(new Subject<void>());

            testable.addItemToWishlist(3);

            expect(add_spy).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }), 0);
            expect(proposedIds()).toEqual([2]);
        });

        it('rafraîchit la liste après l\'ajout', (): void => {
            const refreshed: WishlistInfo = new WishlistInfo({ wishList: [buildRowDto(1, 0, 1), buildRowDto(3, 0, -1)], lastUpdateInfo: null });
            vi.spyOn(wishlist_service, 'addItemToWishlist').mockReturnValue(of(undefined));
            vi.spyOn(wishlist_service, 'getWishlist').mockReturnValue(of(refreshed));

            testable.addItemToWishlist(3);

            expect(testable.wishlist_info()).toBe(refreshed);
            expect(proposedIds()).toEqual([2]);
        });

        it('propose de nouveau l\'objet si l\'ajout échoue', (): void => {
            vi.spyOn(wishlist_service, 'addItemToWishlist').mockReturnValue(throwError((): Error => new Error('500')));

            testable.addItemToWishlist(3);

            expect(proposedIds()).toEqual([2, 3]);
        });
    });
});
