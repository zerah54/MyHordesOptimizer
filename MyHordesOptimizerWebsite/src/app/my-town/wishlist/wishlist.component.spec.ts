import { CdkDrag, CdkDragDrop, CdkDragMove, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { HttpRequest, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement, EventEmitter, WritableSignal } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import moment from 'moment';
import { of, Subject, throwError } from 'rxjs';
import type { MockInstance } from 'vitest';

import { WISHLIST_EXPANDED_GROUPS_KEY } from '../../_abstract_model/const';
import { UserWishlistGroupDTO } from '../../_abstract_model/dto/user-wishlist-group.dto';
import { WishlistGroupDTO } from '../../_abstract_model/dto/wishlist-group.dto';
import { WishlistInfoDTO } from '../../_abstract_model/dto/wishlist-info.dto';
import { WishlistItemDTO } from '../../_abstract_model/dto/wishlist-item.dto';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { AddMenuGroup, ListForAddRemove } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistGroup } from '../../_abstract_model/types/wishlist-group.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { DeferredCellComponent } from '../../_shared/deferred-cell/deferred-cell.component';
import { ItemMapComponent } from '../../_shared/item-map/item-map.component';
import { WishlistAdvancedAddData, WishlistAdvancedAddResult } from './advanced-add/wishlist-advanced-add.component';
import { WishlistComponent } from './wishlist.component';
import { WishlistRow } from './wishlist-rows.util';

interface TestableComponent {
    wishlist_info: WritableSignal<WishlistInfo | null>;
    edition_mode: WritableSignal<boolean>;
    datasource: MatTableDataSource<WishlistRow>;
    items: WritableSignal<Item[]>;
    current_zone_xp_pa_add_item: WritableSignal<number>;
    add_lists(): ListForAddRemove[];
    add_groups(): AddMenuGroup[];
    my_groups: WritableSignal<UserWishlistGroupDTO[]>;
    addGroup(key: string): void;
    deleteGroup(key: string): void;
    openAdvancedAdd(): void;
    editGroup(key: string): void;
    selected(): Set<string>;
    wishlist_filters_change: EventEmitter<void>;
    addItemToWishlist(item_id: number): void;
    sortWishlist(event: CdkDragDrop<MatTableDataSource<WishlistRow>>): void;
    unsaved_duplicates(): string[];
    auto_save$: Subject<WishlistInfo>;
    triggerSave(): void;
    setGroupCount(group: WishlistGroup, count: number | null): void;
    setGroupZone(group: WishlistGroup, zone: number | null): void;
    buildExcelRows(items: WishlistItem[], groups?: WishlistGroup[]): Record<string, string | number>[];
    rowsToWishlist(rows: Record<string, string | number>[]): WishlistInfo;
    item_emotes: WritableSignal<Record<string, string>>;
    forumLabel(item: Item): string;
    shareWishlistForum(): void;
    expanded_groups: WritableSignal<Set<string>>;
    drop_group_uid: WritableSignal<string | null>;
    toggleGroup(uid: string): void;
    setAllGroupsExpanded(expanded: boolean): void;
    changeGroupSettings(group: WishlistGroup): void;
    takeOutOfGroup(item: WishlistItem): void;
    removeGroup(group: WishlistGroup): void;
    joinGroup(item: WishlistItem, group: WishlistGroup): void;
    trackDropTarget(row: WishlistRow, event: CdkDragMove): void;
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
        actionEffects: [], reloadCharges: null, watchImpact: 0, bagCapacityBonus: null, bagExclusiveGroup: null,
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

    it('précède du tag d\'emote les objets qui en ont un, au format forum', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        const http: HttpTestingController = TestBed.inject(HttpTestingController);
        const locale: string = moment.locale();
        fixture.detectChanges();
        http.expectOne((request: HttpRequest<unknown>): boolean => request.url.endsWith('/Fetcher/ItemEmotes')).flush({ 'wire_#00': ':item_wire:' });

        const label = (uid: string): string => testable.forumLabel(Object.assign(new Item(), { uid, label: { [locale]: 'Objet' } }));

        expect(label('wire_#00')).toBe(':item_wire: Objet');
        expect(label('wood2_#00')).toBe('Objet');
    });

    describe('copie au format forum', (): void => {
        /** Texte copié pour une liste contenant les lignes données. */
        function copiedText(rows: WishlistItemDTO[], groups: WishlistGroupDTO[] = []): string {
            const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
            const copy_spy: MockInstance<ClipboardService['copy']> = vi.spyOn(TestBed.inject(ClipboardService), 'copy').mockImplementation((): void => undefined);
            testable.wishlist_info.set(new WishlistInfo({
                wishList: rows,
                groups,
                lastUpdateInfo: { updateTime: new Date(), userId: '1', userName: 'Bob', userKey: 'k' }
            }));
            testable.shareWishlistForum();
            return copy_spy.mock.calls[0][0];
        }

        it('met en italique les objets à déposer dans la zone de rapatriement et l\'explique en légende', (): void => {
            const text: string = copiedText([{ ...buildRowDto(1, 0, 5), depot: 1 }, buildRowDto(2, 0, 1)]);

            expect(text).toContain(':middot:[i]Objet 1 (x5)[/i]\n');
            expect(text).toContain(':middot:Objet 2 (x1)\n');
            expect(text).not.toContain('Zone de rappatriement');
            expect(text).toContain('Légende : [i]Zone de rapatriement[/i]');
        });

        it('ajoute à la légende les objets à signaler, seulement s\'il y en a', (): void => {
            expect(copiedText([{ ...buildRowDto(1, 0, 5), shouldSignal: true }]))
                .toContain('Légende : [bad]Objet à signaler[/bad]:warning:\n');
        });

        it('réunit les deux légendes sur une ligne', (): void => {
            expect(copiedText([{ ...buildRowDto(1, 0, 5), depot: 1 }, { ...buildRowDto(2, 0, 1), shouldSignal: true }]))
                .toContain('Légende : [i]Zone de rapatriement[/i] · [bad]Objet à signaler[/bad]:warning:\n');
        });

        it('termine la ligne par sa zone en PA, sauf pour la zone infinie', (): void => {
            const text: string = copiedText([buildRowDto(1, 0, 10), { ...buildRowDto(1, 2, 3), depot: 1 }]);

            expect(text).toContain(':middot:Objet 1 (x10)\n');
            expect(text).toContain(':middot:[i]Objet 1 (x3) – zone 2:ap:[/i]\n');
        });

        it('n\'ajoute pas de légende sans objet à déposer dans la zone de rapatriement ni à signaler', (): void => {
            expect(copiedText([buildRowDto(1, 0, 5)])).not.toContain('Légende');
        });

        describe('groupes', (): void => {
            /** Membre du groupe g1 : objet `id` de balise `:item_x:`, encombrant ou non. */
            function member(id: number, extra: Partial<WishlistItemDTO> = {}, heavy: boolean = false): WishlistItemDTO {
                const base: WishlistItemDTO = buildRowDto(id, 5, 30);
                return { ...base, item: { ...base.item, uid: `u${id}`, isHeaver: heavy }, groupUid: 'g1', ...extra };
            }
            const group: WishlistGroupDTO = { uid: 'g1', name: 'B6', priority: 5, zoneXPa: 5, depot: 0, count: 30 };

            beforeEach((): void => {
                (fixture.componentInstance as unknown as TestableComponent).item_emotes.set({ u1: ':item_a:', u2: ':item_b:' });
            });

            it('résume un groupe en une seule ligne', (): void => {
                const text: string = copiedText([member(1), member(2)], [group]);

                expect(text).toContain(':middot:B6 : :item_a: :item_b: (x30) – zone 5:ap:\n');
            });

            it('met en [bad] le membre signalé et termine la ligne par :warning:', (): void => {
                const text: string = copiedText([member(1), member(2, { shouldSignal: true })], [group]);

                expect(text).toContain(':middot:B6 : :item_a: [bad]:item_b:[/bad] (x30) – zone 5:ap::warning:\n');
            });

            it('range un groupe entièrement encombrant sous « Encombrants »', (): void => {
                const text: string = copiedText([member(1, {}, true), member(2, {}, true)], [group]);

                expect(text).toMatch(/\[collapse=Encombrants\]\n:middot:B6 [^\n]*\n\[\/collapse\]/);
                expect(text).not.toContain('[collapse=Non-Encombrants]');
            });

            it('range un groupe mixte sous « Non-Encombrants »', (): void => {
                const text: string = copiedText([member(1, {}, true), member(2)], [group]);

                expect(text).toMatch(/\[collapse=Non-Encombrants\]\n:middot:B6 [^\n]*\n\[\/collapse\]/);
                expect(text).not.toContain('[collapse=Encombrants]');
            });

            it('range un groupe « Ne pas ramener » sous « Ne pas rapporter »', (): void => {
                const text: string = copiedText([member(1, { priority: -1, depot: -2 })], [{ ...group, priority: -1, depot: -2 }]);

                expect(text).toMatch(/\[collapse=Ne pas rapporter\]\n:middot:B6 : :item_a:\n\[\/collapse\]/);
            });
        });
    });

    describe('Excel avec groupes', (): void => {
        let testable: TestableComponent;

        beforeEach((): void => {
            testable = fixture.componentInstance as unknown as TestableComponent;
            testable.items.set([1, 2, 3].map((id: number): Item => new Item(buildItemDto({ id }))));
        });

        function groupedInfo(): WishlistInfo {
            return new WishlistInfo({
                wishList: [
                    { ...buildRowDto(3, 0, 1), priority: 9 },
                    { ...buildRowDto(1, 5, 30), priority: 5, depot: 1, groupUid: 'g1' },
                    { ...buildRowDto(2, 5, 30), priority: 5, depot: 1, groupUid: 'g1' }
                ],
                groups: [{ uid: 'g1', name: 'B6', priority: 5, zoneXPa: 5, depot: 1, count: 30 }],
                lastUpdateInfo: null
            });
        }

        it('reconstitue après aller-retour un groupe de même nom, stock, zone, dépôt et membres', (): void => {
            const source: WishlistInfo = groupedInfo();

            const result: WishlistInfo = testable.rowsToWishlist(testable.buildExcelRows(source.wishlist_items, source.groups));

            expect(result.groups.length).toBe(1);
            const [group] = result.groups;
            expect([group.name, group.count, group.zone_x_pa, group.depot.value.count]).toEqual(['B6', 30, 5, 1]);
            expect(result.membersOf(group.uid).map((row: WishlistItem): number => row.item.id).sort()).toEqual([1, 2]);
            expect(result.wishlist_items.filter((row: WishlistItem): boolean => row.group_uid === null).map((row: WishlistItem): number => row.item.id)).toEqual([3]);
        });

        it('garde deux groupes de même nom situés dans des zones différentes', (): void => {
            const result: WishlistInfo = testable.rowsToWishlist([
                { Identifiant: 1, 'Zone de dépôt': 0, Zone: 0, 'Quantité souhaitée': 4, Groupe: 'B6' },
                { Identifiant: 2, 'Zone de dépôt': 0, Zone: 0, 'Quantité souhaitée': 4, Groupe: 'B6' },
                { Identifiant: 1, 'Zone de dépôt': 0, Zone: 5, 'Quantité souhaitée': 4, Groupe: 'B6' },
                { Identifiant: 2, 'Zone de dépôt': 0, Zone: 5, 'Quantité souhaitée': 4, Groupe: 'B6' }
            ]);

            expect(result.groups.map((group: WishlistGroup): number => group.zone_x_pa).sort()).toEqual([0, 5]);
            expect(result.groups.every((group: WishlistGroup): boolean => result.membersOf(group.uid).length === 2)).toBe(true);
        });

        it('conserve dans le corps du PUT les membres d\'un groupe à stock 0', (): void => {
            const source: WishlistInfo = groupedInfo();
            source.groups[0].count = 0;
            source.applyGroupSettings(source.groups[0]);

            const result: WishlistInfo = testable.rowsToWishlist(testable.buildExcelRows(source.wishlist_items, source.groups));

            expect(result.toPutDto().items.filter((row: { groupUid: string | null }): boolean => row.groupUid !== null).length).toBe(2);
        });

        it('importe en lignes seules un fichier sans colonne « Groupe »', (): void => {
            const result: WishlistInfo = testable.rowsToWishlist([
                { Identifiant: 1, 'Zone de dépôt': 0, Zone: 0, 'Quantité souhaitée': 4 },
                { Identifiant: 2, 'Zone de dépôt': 0, Zone: 3, 'Quantité souhaitée': 2 }
            ]);

            expect(result.groups).toEqual([]);
            expect(result.wishlist_items.map((row: WishlistItem): number => row.item.id)).toEqual([1, 2]);
            expect(result.wishlist_items.every((row: WishlistItem): boolean => row.group_uid === null)).toBe(true);
        });
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

        testable.sortWishlist({ item: { data: dragged }, previousIndex: 0, currentIndex: 1 } as unknown as CdkDragDrop<MatTableDataSource<WishlistRow>>);

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
            testable.sortWishlist({ item: { data: row }, previousIndex: previous_index, currentIndex: current_index } as unknown as CdkDragDrop<MatTableDataSource<WishlistRow>>);
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

    describe('groupes du menu d\'ajout', (): void => {
        let testable: TestableComponent;
        let wishlist_service: WishlistService;

        function itemWith(id: number, extra: Partial<WishlistItemDTO['item']> = {}): Item {
            return new Item(buildItemDto({ id, uid: `uid_${id}`, label: { fr: `Objet ${id}` }, ...extra }));
        }

        beforeEach((): void => {
            testable = fixture.componentInstance as unknown as TestableComponent;
            wishlist_service = TestBed.inject(WishlistService);
            fixture.detectChanges();
            testable.items.set([itemWith(1, { actions: ['eat_6ap'] }), itemWith(2, { actions: ['eat_6ap'] }), itemWith(3, { actions: ['eat_6ap'] }), itemWith(4)]);
            testable.wishlist_info.set(new WishlistInfo({ wishList: [buildRowDto(1, 8, 1), buildRowDto(4, 8, 1), buildRowDto(2, 0, 1)], lastUpdateInfo: null }));
            testable.current_zone_xp_pa_add_item.set(8);
        });

        function group(key: string): AddMenuGroup {
            return testable.add_groups().find((candidate: AddMenuGroup): boolean => candidate.key === key)!;
        }

        it('liste les groupes du jeu avec les seuls objets du groupe déjà placés dans la zone', (): void => {
            const b6: AddMenuGroup = group('game:b6');

            expect(b6.section).toBe('game');
            expect(b6.manageable).toBe(false);
            expect(b6.items.map((item: Item): number => item.id)).toEqual([1, 2, 3]);
            expect([...b6.placed_item_ids]).toEqual([1]);
        });

        it('liste mes groupes, modifiables, par uid d\'objet', (): void => {
            testable.my_groups.set([{ id: 3, name: 'Kit', itemUids: ['uid_2', 'uid_4'], updatedAt: '' }]);

            const kit: AddMenuGroup = group('user:3');

            expect(kit.section).toBe('user');
            expect(kit.manageable).toBe(true);
            expect(kit.label).toBe('Kit');
            expect(kit.items.map((item: Item): number => item.id)).toEqual([2, 4]);
            expect([...kit.placed_item_ids]).toEqual([4]);
        });

        it('ajoute un groupe du jeu sans ses objets déjà placés, puis recharge', (): void => {
            const refreshed: WishlistInfo = new WishlistInfo({ wishList: [buildRowDto(1, 8, 1), buildRowDto(2, 8, -1), buildRowDto(3, 8, -1)], lastUpdateInfo: null });
            const add_spy: MockInstance<WishlistService['addGroupToWishlist']> = vi.spyOn(wishlist_service, 'addGroupToWishlist').mockReturnValue(of(refreshed));

            testable.addGroup('game:b6');

            expect(add_spy).toHaveBeenCalledWith('B6', [2, 3], 8, -1);
            expect(testable.wishlist_info()).toBe(refreshed);
        });

        it('supprime mon groupe confirmé', (): void => {
            testable.my_groups.set([{ id: 3, name: 'Kit', itemUids: [], updatedAt: '' }]);
            vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);
            const delete_spy: MockInstance<WishlistService['deleteMyGroup']> = vi.spyOn(wishlist_service, 'deleteMyGroup').mockReturnValue(of(undefined));

            testable.deleteGroup('user:3');

            expect(delete_spy).toHaveBeenCalledWith(3);
            expect(testable.my_groups()).toEqual([]);
        });

        describe('ajout avancé', (): void => {
            function mockDialog(result: WishlistAdvancedAddResult | undefined): MockInstance<MatDialog['open']> {
                return vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(result) } as ReturnType<MatDialog['open']>);
            }

            it('ouvre la fenêtre avec les objets, les placés de la zone et la zone', (): void => {
                const open_spy: MockInstance<MatDialog['open']> = mockDialog(undefined);

                testable.openAdvancedAdd();

                const data: WishlistAdvancedAddData = open_spy.mock.calls[0][1]!.data as WishlistAdvancedAddData;
                expect(data.zone).toBe(8);
                expect(data.edit).toBeNull();
                expect(data.items.length).toBe(4);
                expect([...data.placedIdsInZone(8)]).toEqual([1, 4]);
            });

            it('enregistre le groupe perso puis l\'ajoute à la liste, sans les objets déjà placés', (): void => {
                mockDialog({ name: 'Kit', item_ids: [1, 2, 3], count: 5, zone: 8, save_as_user_group: true });
                const created: UserWishlistGroupDTO = { id: 9, name: 'Kit', itemUids: ['uid_1', 'uid_2', 'uid_3'], updatedAt: '' };
                const create_spy: MockInstance<WishlistService['createMyGroup']> = vi.spyOn(wishlist_service, 'createMyGroup').mockReturnValue(of(created));
                const refreshed: WishlistInfo = new WishlistInfo({ wishList: [buildRowDto(2, 8, 5)], lastUpdateInfo: null });
                const add_spy: MockInstance<WishlistService['addGroupToWishlist']> = vi.spyOn(wishlist_service, 'addGroupToWishlist').mockReturnValue(of(refreshed));

                testable.openAdvancedAdd();

                expect(create_spy).toHaveBeenCalledWith('Kit', ['uid_1', 'uid_2', 'uid_3']);
                expect(add_spy).toHaveBeenCalledWith('Kit', [2, 3], 8, 5);
                expect(testable.my_groups()).toEqual([created]);
                expect(testable.wishlist_info()).toBe(refreshed);
            });

            it('n\'enregistre pas de groupe perso sans la case', (): void => {
                mockDialog({ name: 'Kit', item_ids: [2], count: -1, zone: 8, save_as_user_group: false });
                const create_spy: MockInstance<WishlistService['createMyGroup']> = vi.spyOn(wishlist_service, 'createMyGroup');
                const add_spy: MockInstance<WishlistService['addGroupToWishlist']> = vi.spyOn(wishlist_service, 'addGroupToWishlist')
                    .mockReturnValue(of(new WishlistInfo({ wishList: [], lastUpdateInfo: null })));

                testable.openAdvancedAdd();

                expect(create_spy).not.toHaveBeenCalled();
                expect(add_spy).toHaveBeenCalledWith('Kit', [2], 8, -1);
            });

            it('garde le groupe de la ville dans la liste même si l\'enregistrement de mon groupe échoue', (): void => {
                mockDialog({ name: 'Kit', item_ids: [2, 3], count: 5, zone: 8, save_as_user_group: true });
                vi.spyOn(wishlist_service, 'createMyGroup').mockReturnValue(throwError((): Error => new Error('409')));
                const refreshed: WishlistInfo = new WishlistInfo({ wishList: [buildRowDto(2, 8, 5)], lastUpdateInfo: null });
                const add_spy: MockInstance<WishlistService['addGroupToWishlist']> = vi.spyOn(wishlist_service, 'addGroupToWishlist').mockReturnValue(of(refreshed));

                testable.openAdvancedAdd();

                expect(add_spy).toHaveBeenCalledWith('Kit', [2, 3], 8, 5);
                expect(testable.wishlist_info()).toBe(refreshed);
            });

            it('en modification, ouvre la fenêtre préremplie et ne fait que mettre à jour le groupe perso', (): void => {
                testable.my_groups.set([{ id: 3, name: 'Kit', itemUids: ['uid_2'], updatedAt: '' }]);
                const open_spy: MockInstance<MatDialog['open']> = mockDialog({ name: 'Kit 2', item_ids: [2, 3], count: -1, zone: 8, save_as_user_group: true });
                const updated: UserWishlistGroupDTO = { id: 3, name: 'Kit 2', itemUids: ['uid_2', 'uid_3'], updatedAt: '' };
                const update_spy: MockInstance<WishlistService['updateMyGroup']> = vi.spyOn(wishlist_service, 'updateMyGroup').mockReturnValue(of(updated));
                const create_spy: MockInstance<WishlistService['createMyGroup']> = vi.spyOn(wishlist_service, 'createMyGroup');
                const add_spy: MockInstance<WishlistService['addGroupToWishlist']> = vi.spyOn(wishlist_service, 'addGroupToWishlist');

                testable.editGroup('user:3');

                expect((open_spy.mock.calls[0][1]!.data as WishlistAdvancedAddData).edit).toEqual({ name: 'Kit', item_uids: ['uid_2'] });
                expect(update_spy).toHaveBeenCalledWith(3, 'Kit 2', ['uid_2', 'uid_3']);
                expect(create_spy).not.toHaveBeenCalled();
                expect(add_spy).not.toHaveBeenCalled();
                expect(testable.my_groups()).toEqual([updated]);
            });
        });

        it('ne supprime pas mon groupe si la confirmation est refusée', (): void => {
            testable.my_groups.set([{ id: 3, name: 'Kit', itemUids: [], updatedAt: '' }]);
            vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(false) } as ReturnType<MatDialog['open']>);
            const delete_spy: MockInstance<WishlistService['deleteMyGroup']> = vi.spyOn(wishlist_service, 'deleteMyGroup');

            testable.deleteGroup('user:3');

            expect(delete_spy).not.toHaveBeenCalled();
        });
    });

    it('affiche ∞ pour la zone infinie hors mode édition', async (): Promise<void> => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        testable.wishlist_info.set(new WishlistInfo({ wishList: [buildRowDto(1, 0, 1), buildRowDto(2, 2, 1)], lastUpdateInfo: null }));
        fixture.detectChanges();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();

        const zones: string[] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('tbody td.mat-column-zone_x_pa'))
            .map((cell: HTMLElement): string => cell.textContent?.trim() ?? '');
        expect(zones).toEqual(['∞', '2']);
    });

    describe('colonne Carte', (): void => {
        beforeEach(async (): Promise<void> => {
            const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
            testable.wishlist_info.set(new WishlistInfo({ wishList: [{ ...buildRowDto(1, 0, 1), mapCellItemCount: 3 }, buildRowDto(2, 0, 1)], lastUpdateInfo: null }));
            fixture.detectChanges();
            for (const block of await fixture.getDeferBlocks()) {
                await block.render(DeferBlockState.Complete);
            }
            fixture.detectChanges();
        });

        function mapCells(): HTMLElement[] {
            return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('tbody td.mat-column-map_cell_item_count'));
        }

        it('garde le nombre du serveur et ouvre au survol la carte de la ville quand des objets sont au sol', (): void => {
            TestBed.inject(HttpTestingController).expectOne((request: HttpRequest<unknown>): boolean => request.url.includes('/Fetcher/map?'))
                .flush({ townId: 1, townX: 1, townY: 0, mapHeight: 1, mapWidth: 3, isChaos: false, isDevasted: false, isDoorOpen: true, waterWell: 0, day: 1, cells: [] });
            fixture.detectChanges();

            const [with_items, without_items]: HTMLElement[] = mapCells();
            expect(with_items.textContent?.trim()).toBe('3');
            const item_map: ItemMapComponent = fixture.debugElement.query(By.directive(ItemMapComponent)).componentInstance as ItemMapComponent;
            expect(item_map.itemId()).toBe(1);
            expect(item_map.map()?.map_width).toBe(3);
            expect(without_items.textContent?.trim()).toBe('0');
            expect(without_items.querySelector('mho-item-map')).toBeNull();
        });
    });

    describe('groupes', (): void => {
        let testable: TestableComponent;

        /** Liste : ligne 8 (priorité 9), groupe g1 (priorité 5, zone 4, objets `member_ids`), ligne 9 (priorité 1). */
        function buildGroupedInfo(member_ids: number[] = [2, 3], extra_lines: WishlistItemDTO[] = []): WishlistInfo {
            return new WishlistInfo({
                wishList: [
                    { ...buildRowDto(8, 0, 1), priority: 9 },
                    ...member_ids.map((id: number): WishlistItemDTO => ({ ...buildRowDto(id, 4, 10), priority: 5, groupUid: 'g1', shouldSignal: id === 2 })),
                    { ...buildRowDto(9, 0, 1), priority: 1 },
                    ...extra_lines
                ],
                groups: [{ uid: 'g1', name: 'B6', priority: 5, zoneXPa: 4, depot: 0, count: 10 }],
                lastUpdateInfo: null
            });
        }

        function info(): WishlistInfo {
            return testable.wishlist_info() as WishlistInfo;
        }

        function itemOf(id: number): WishlistItem {
            return info().wishlist_items.find((row: WishlistItem): boolean => row.item.id === id) as WishlistItem;
        }

        function ids(): number[] {
            return info().wishlist_items.map((row: WishlistItem): number => row.item.id);
        }

        function kinds(): string[] {
            return testable.datasource.data.map((row: WishlistRow): string => row.kind);
        }

        beforeEach((): void => {
            localStorage.removeItem(WISHLIST_EXPANDED_GROUPS_KEY);
            testable = fixture.componentInstance as unknown as TestableComponent;
            testable.wishlist_info.set(buildGroupedInfo());
            fixture.detectChanges();
        });

        it('ignore une saisie vidée sur le stock ou la zone d\'un groupe', (): void => {
            const group: WishlistGroup = info().groups[0];

            testable.setGroupCount(group, null);
            testable.setGroupZone(group, null);

            expect([group.count, group.zone_x_pa]).toEqual([10, 4]);
            expect(itemOf(2).count).toBe(10);
        });

        it('continue d\'enregistrer après une erreur du PUT', (): void => {
            vi.useFakeTimers();
            try {
                const update_spy: MockInstance<WishlistService['updateWishlist']> = vi.spyOn(TestBed.inject(WishlistService), 'updateWishlist')
                    .mockReturnValueOnce(throwError((): Error => new Error('400')))
                    .mockReturnValue(of(buildGroupedInfo()));

                testable.auto_save$.next(buildGroupedInfo());
                vi.advanceTimersByTime(600);
                testable.auto_save$.next(buildGroupedInfo());
                vi.advanceTimersByTime(600);

                expect(update_spy).toHaveBeenCalledTimes(2);
            } finally {
                vi.useRealTimers();
            }
        });

        it('affiche 0 et non ∞ pour un groupe au stock 0 hors mode édition', async (): Promise<void> => {
            const group: WishlistGroup = info().groups[0];
            group.count = 0;
            info().applyGroupSettings(group);
            testable.wishlist_info.set(info());
            fixture.detectChanges();
            for (const block of await fixture.getDeferBlocks()) {
                await block.render(DeferBlockState.Complete);
            }
            fixture.detectChanges();

            const cells: string[] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('tbody td.mat-column-count'))
                .map((cell: HTMLElement): string => cell.textContent?.trim() ?? '');
            expect(cells[1]).toBe('0');
        });

        it('affiche un groupe replié par défaut, puis ses membres une fois déplié', (): void => {
            expect(kinds()).toEqual(['item', 'group', 'item']);

            testable.expanded_groups.set(new Set(['g1']));
            fixture.detectChanges();

            expect(kinds()).toEqual(['item', 'group', 'member', 'member', 'item']);
        });

        it('écrit dans le stockage local les uid des groupes dépliés', (): void => {
            testable.toggleGroup('g1');

            expect(JSON.parse(localStorage.getItem(WISHLIST_EXPANDED_GROUPS_KEY) as string)).toEqual(['g1']);

            testable.toggleGroup('g1');

            expect(JSON.parse(localStorage.getItem(WISHLIST_EXPANDED_GROUPS_KEY) as string)).toEqual([]);
        });

        it('déplie ou replie tous les groupes', (): void => {
            testable.setAllGroupsExpanded(true);

            expect([...testable.expanded_groups()]).toEqual(['g1']);

            testable.setAllGroupsExpanded(false);

            expect(testable.expanded_groups().size).toBe(0);
        });

        it('suspend l\'enregistrement quand la zone du groupe crée un doublon', (): void => {
            testable.wishlist_info.set(buildGroupedInfo([2, 3], [buildRowDto(2, 7, 1)]));
            const next_spy: MockInstance<(value: WishlistInfo) => void> = vi.spyOn(testable.auto_save$, 'next');
            const group: WishlistGroup = info().groups[0];
            group.zone_x_pa = 7;

            testable.changeGroupSettings(group);

            expect(testable.unsaved_duplicates()).toEqual(['Objet 2']);
            expect(next_spy).not.toHaveBeenCalled();
        });

        it('sort un objet du groupe : ligne seule juste après le groupe, stock ∞ comme un ajout unitaire, zone et signalement conservés', (): void => {
            testable.takeOutOfGroup(info().membersOf('g1').find((row: WishlistItem): boolean => row.item.id === 2) as WishlistItem);

            const out: WishlistItem = itemOf(2);
            expect(out.group_uid).toBeNull();
            expect(out.count).toBe(-1);
            expect(out.zone_x_pa).toBe(4);
            expect(out.should_signal).toBe(true);
            expect(ids()).toEqual([8, 3, 2, 9]);
            expect(info().groups.length).toBe(1);
        });

        it('supprime le groupe quand son dernier objet sort', (): void => {
            testable.wishlist_info.set(buildGroupedInfo([2]));

            testable.takeOutOfGroup(info().membersOf('g1')[0]);

            expect(info().groups).toEqual([]);
            expect(ids()).toEqual([8, 2, 9]);
        });

        it('retire le groupe et ses objets après confirmation', (): void => {
            vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);

            testable.removeGroup(info().groups[0]);

            expect(info().groups).toEqual([]);
            expect(ids()).toEqual([8, 9]);
        });

        it('ne change rien si la suppression du groupe est refusée', (): void => {
            vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(false) } as ReturnType<MatDialog['open']>);
            const before: number[] = ids();

            testable.removeGroup(info().groups[0]);

            expect(info().groups.length).toBe(1);
            expect(ids()).toEqual(before);
        });

        it('fait rejoindre le groupe à un objet seul, avec zone, dépôt, priorité et stock du groupe', (): void => {
            testable.joinGroup(itemOf(9), info().groups[0]);

            const joined: WishlistItem = itemOf(9);
            const group: WishlistGroup = info().groups[0];
            expect(joined.group_uid).toBe('g1');
            expect(joined.zone_x_pa).toBe(group.zone_x_pa);
            expect(joined.count).toBe(group.count);
            expect(joined.depot.value.count).toBe(group.depot.value.count);
            expect(joined.priority).toBe(group.priority);
        });

        describe('dépôt d\'un objet seul dans un groupe déplié', (): void => {
            /** Lignes affichées : 8, groupe g1, membre 2, membre 3, 9 (index 0 à 4). */
            function dropAt(id: number, previous_index: number, current_index: number): void {
                testable.setAllGroupsExpanded(true);
                fixture.detectChanges();
                testable.sortWishlist({ item: { data: itemOf(id) }, previousIndex: previous_index, currentIndex: current_index } as unknown as CdkDragDrop<MatTableDataSource<WishlistRow>>);
            }

            it('entre deux objets du groupe, en remontant : l\'objet rejoint le groupe', (): void => {
                dropAt(9, 4, 3);
                expect(itemOf(9).group_uid).toBe('g1');
                expect(itemOf(9).zone_x_pa).toBe(4);
            });

            it('entre deux objets du groupe, en descendant : l\'objet rejoint le groupe', (): void => {
                dropAt(8, 0, 2);
                expect(itemOf(8).group_uid).toBe('g1');
            });

            it('juste sous la ligne du groupe : l\'objet rejoint le groupe', (): void => {
                dropAt(9, 4, 2);
                expect(itemOf(9).group_uid).toBe('g1');
            });

            /** Coche les lignes de clés données. */
            function select(keys: string[]): void {
                (fixture.componentInstance as unknown as { selected: WritableSignal<Set<string>> }).selected.set(new Set(keys));
            }

            it('une sélection de lignes seules déposée entre deux objets du groupe : toutes rejoignent le groupe', (): void => {
                select(['8_0', '9_0']);
                dropAt(9, 4, 3);
                expect(itemOf(8).group_uid).toBe('g1');
                expect(itemOf(9).group_uid).toBe('g1');
                expect(testable.selected().size).toBe(0);
            });

            it('une sélection contenant un groupe n\'entre pas dans un groupe : simple réordonnement', (): void => {
                select(['8_0', 'group:g1']);
                dropAt(8, 0, 3);
                expect(itemOf(8).group_uid).toBeNull();
            });

            it('après le dernier objet du groupe : simple réordonnement, l\'objet reste seul', (): void => {
                dropAt(8, 0, 3);
                expect(itemOf(8).group_uid).toBeNull();
            });
        });

        it('déplace un groupe avec ses objets : leur priorité suit celle du groupe', (): void => {
            testable.sortWishlist({ item: { data: info().groups[0] }, previousIndex: 1, currentIndex: 0 } as unknown as CdkDragDrop<MatTableDataSource<WishlistRow>>);

            expect(info().groups[0].priority).toBe(999);
            expect(itemOf(2).priority).toBe(999);
            expect(itemOf(3).priority).toBe(999);
            expect(itemOf(8).priority).toBe(998);
            expect(itemOf(9).priority).toBe(997);
        });

        it('ne coche que les lignes seules et les groupes, jamais les objets d\'un groupe déplié', async (): Promise<void> => {
            testable.edition_mode.set(true);
            testable.setAllGroupsExpanded(true);
            fixture.detectChanges();
            for (const block of await fixture.getDeferBlocks()) {
                await block.render(DeferBlockState.Complete);
            }
            fixture.detectChanges();

            const boxes: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('td.mat-column-select input[type="checkbox"]');
            expect(boxes.length).toBe(3);
            boxes[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            fixture.detectChanges();

            expect([...testable.selected()]).toEqual(['group:g1']);
        });

        it('ne se saisit que par la poignée, y compris après un repli puis un dépli', async (): Promise<void> => {
            /** Nombre de poignées enregistrées par chaque ligne déplaçable (0 = toute la ligne se saisit). */
            const handleCounts: () => number[] = (): number[] => fixture.debugElement.queryAll(By.directive(CdkDrag))
                .map((element: DebugElement): CdkDrag => element.injector.get(CdkDrag))
                .filter((drag: CdkDrag): boolean => !drag.disabled)
                .map((drag: CdkDrag): number => (drag._dragRef as unknown as { _handles: unknown[] })._handles.length);
            const render: () => Promise<void> = async (): Promise<void> => {
                fixture.detectChanges();
                for (const block of await fixture.getDeferBlocks()) {
                    await block.render(DeferBlockState.Complete);
                }
                fixture.detectChanges();
            };

            testable.edition_mode.set(true);
            await render();
            expect(handleCounts().length).toBeGreaterThan(0);
            expect(handleCounts()).toEqual(handleCounts().map((): number => 1));

            testable.setAllGroupsExpanded(true);
            await render();
            testable.setAllGroupsExpanded(false);
            await render();
            expect(handleCounts()).toEqual(handleCounts().map((): number => 1));
        });

        describe('dépôt sur une ligne de groupe', (): void => {
            /** Fait pointer `document.elementFromPoint` sur une ligne de groupe de hauteur 40 en haut 100. */
            function pointAtGroupRow(): void {
                const row: HTMLElement = document.createElement('tr');
                row.dataset['groupUid'] = 'g1';
                row.getBoundingClientRect = (): DOMRect => ({ top: 100, height: 40, bottom: 140 } as DOMRect);
                const cell: HTMLElement = row.appendChild(document.createElement('td'));
                Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: (): Element => cell });
            }

            function move(y: number): void {
                testable.trackDropTarget({ kind: 'item', item: itemOf(9) }, { pointerPosition: { x: 5, y } } as CdkDragMove);
            }

            afterEach((): void => {
                delete (document as unknown as Record<string, unknown>)['elementFromPoint'];
            });

            it('ne surligne le groupe que sur la moitié centrale de la ligne', (): void => {
                pointAtGroupRow();

                move(120);
                expect(testable.drop_group_uid()).toBe('g1');

                move(102);
                expect(testable.drop_group_uid()).toBeNull();
            });

            it('fait rejoindre le groupe au lâcher et efface le surlignage', (): void => {
                testable.drop_group_uid.set('g1');

                testable.sortWishlist({ item: { data: itemOf(9) }, previousIndex: 2, currentIndex: 1 } as unknown as CdkDragDrop<MatTableDataSource<WishlistRow>>);

                expect(itemOf(9).group_uid).toBe('g1');
                expect(testable.drop_group_uid()).toBeNull();
            });
        });
    });
});
