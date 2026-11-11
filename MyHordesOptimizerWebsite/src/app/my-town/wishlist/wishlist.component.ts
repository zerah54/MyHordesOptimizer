import { CdkDragDrop, CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    EventEmitter,
    inject,
    OnInit,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { catchError, EMPTY, Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, switchMap } from 'rxjs/operators';
import { read, utils, WorkBook, WorkSheet, write } from 'xlsx';

import { environment } from '../../../environments/environment';
import { HORDES_IMG_REPO, WISHLIST_EDITION_MODE_KEY, WISHLIST_EXPANDED_GROUPS_KEY } from '../../_abstract_model/const';
import { ItemEmotesDTO } from '../../_abstract_model/dto/item.dto';
import { UserWishlistGroupDTO } from '../../_abstract_model/dto/user-wishlist-group.dto';
import { WishlistDepot } from '../../_abstract_model/enum/wishlist-depot.enum';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { AddMenuGroup, Imports, ListForAddRemove } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { Town } from '../../_abstract_model/types/town.class';
import { newGroupUid, WishlistGroup } from '../../_abstract_model/types/wishlist-group.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { TypedCellDefDirective } from '../../_core/directives/typed-cell-def.directive';
import { ColumnIdPipe } from '../../_core/pipes/column-id.pipe';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { DeferredCellComponent } from '../../_shared/deferred-cell/deferred-cell.component';
import { ItemMapComponent } from '../../_shared/item-map/item-map.component';
import { LastUpdateComponent } from '../../_shared/last-update/last-update.component';
import { MenuAddComponent } from '../../_shared/list-elements-add-remove/menu-add/menu-add.component';
import { HeaderWithStringFilterComponent } from '../../_shared/lists/header-with-string-filter/header-with-string-filter.component';
import { PageTitleComponent } from '../../_shared/page-title/page-title.component';
import { WishlistAdvancedAddComponent, WishlistAdvancedAddData, WishlistAdvancedAddResult } from './advanced-add/wishlist-advanced-add.component';
import { ItemAlreadyInListPipe } from './item-already-in-list.pipe';
import { GameWishlistGroup, gameWishlistGroups, itemCatalog, matchesCriteria } from './wishlist-criteria.util';
import { blocksOf, buildWishlistRows, resetBlockPriorities, WishlistBlock, wishlistItemKey, WishlistRow } from './wishlist-rows.util';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [DeferredCellComponent, HeaderWithStringFilterComponent, ItemMapComponent, LastUpdateComponent, MenuAddComponent, PageTitleComponent];
const directives: Imports = [TypedCellDefDirective];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [DragDropModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatOptionModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTooltipModule];

@Component({
    selector: 'mho-wishlist',
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...directives, ...material_modules, ...pipes, ItemAlreadyInListPipe]
})
export class WishlistComponent implements OnInit {
    public readonly table: Signal<MatTable<WishlistItem> | undefined> = viewChild(MatTable);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();
    protected readonly depots: WishlistDepot[] = WishlistDepot.getAllValues();
    protected wishlist_info: WritableSignal<WishlistInfo | null> = signal(null);
    protected items: WritableSignal<Item[]> = signal([]);
    /** Balises forum des objets, par uid. */
    private readonly item_emotes: WritableSignal<ItemEmotesDTO> = signal({});
    protected edition_mode: WritableSignal<boolean> = signal(JSON.parse(localStorage.getItem(WISHLIST_EDITION_MODE_KEY) || 'false'));
    protected readonly columns: StandardColumn[] = [
        { id: 'sort', header: '', displayed: (): boolean => this.edition_mode() },
        { id: 'select', header: '', displayed: (): boolean => this.edition_mode() },
        { id: 'name', header: $localize`Objet`, sticky: true },
        { id: 'heaver', header: '' },
        { id: 'depot', header: $localize`Dépôt` },
        { id: 'zone_x_pa', header: $localize`Zone en PA` },
        { id: 'bank_count', header: $localize`Banque` },
        { id: 'bag_count', header: $localize`Sacs` },
        { id: 'chest_count', header: $localize`Coffres` },
        { id: 'map_cell_item_count', header: $localize`Carte` },
        { id: 'count', header: $localize`Stock souhaité` },
        { id: 'needed', header: $localize`Quantité manquante` },
        { id: 'should_signal', header: $localize`Signaler` },
        { id: 'delete', header: '', displayed: (): boolean => this.edition_mode() },
    ];
    /** Mode observateur : lecture seule, l'édition est désactivée. */
    protected readonly is_readonly: Signal<boolean> = inject(TownContextService).isReadonly;
    /** Carte de la ville pour la colonne Carte ; nulle tant qu'elle n'est pas chargée ou si elle est indisponible. */
    protected readonly map: Signal<Town | null> = toSignal(
        inject(TownService).getMap().pipe(catchError((): Observable<null> => of(null))), { initialValue: null });
    protected wishlist_filters: WritableSignal<WishlistFilters> = signal({ items: '', depot: [] });
    protected current_zone_xp_pa_add_item: WritableSignal<number> = signal(0);
    protected readonly add_label: string = $localize`Ajouter à la liste de courses`;
    /** Groupes personnels de l'utilisateur, chargés à l'ouverture de la page. */
    protected readonly my_groups: WritableSignal<UserWishlistGroupDTO[]> = signal([]);
    /** Objets déjà présents, sur une ligne ou dans un groupe, dans la zone choisie pour l'ajout */
    private readonly ids_in_zone: Signal<Set<number>> = computed((): Set<number> => this.placedIdsInZone(this.current_zone_xp_pa_add_item()));
    /** Objets proposés par le menu d'ajout : ceux absents de la zone choisie et sans ajout en cours */
    protected readonly add_lists: Signal<ListForAddRemove[]> = computed((): ListForAddRemove[] => {
        const zone: number = this.current_zone_xp_pa_add_item();
        const pending: Set<string> = this.pending_adds();
        const in_zone: Set<number> = this.ids_in_zone();
        return [{
            label: '',
            list: this.items().filter((item: Item): boolean => !in_zone.has(item.id) && !pending.has(`${item.id}_${zone}`))
        }];
    });
    /** Groupes du menu d'ajout : ceux du jeu (clé `game:<clé>`) puis les miens (`user:<id>`), avec leurs objets déjà placés dans la zone. */
    protected readonly add_groups: Signal<AddMenuGroup[]> = computed((): AddMenuGroup[] => {
        const items: Item[] = this.items();
        const catalog: ReadonlyMap<string, Item> = itemCatalog(items);
        const in_zone: Set<number> = this.ids_in_zone();
        const build: (key: string, label: string, section: string, group_items: Item[], manageable: boolean) => AddMenuGroup =
            (key: string, label: string, section: string, group_items: Item[], manageable: boolean): AddMenuGroup => ({
                key, label, section, items: group_items, manageable,
                placed_item_ids: new Set(group_items.filter((item: Item): boolean => in_zone.has(item.id)).map((item: Item): number => item.id))
            });
        return [
            ...gameWishlistGroups().map((group: GameWishlistGroup): AddMenuGroup => build(`game:${group.key}`, group.label, 'game',
                                                                                          items.filter((item: Item): boolean => matchesCriteria(item, group.criteria, catalog)), false)),
            ...this.my_groups().map((group: UserWishlistGroupDTO): AddMenuGroup => build(`user:${group.id}`, group.name, 'user',
                                                                                         items.filter((item: Item): boolean => group.itemUids.includes(item.uid)), true))
        ];
    });
    /** Lignes cochées, par clé {@link wishlistItemKey} */
    protected readonly selected: WritableSignal<Set<string>> = signal(new Set());
    /** Nombre de blocs cochés (lignes seules et groupes) encore présents dans la liste */
    protected readonly selected_count: Signal<number> = computed((): number => {
        const selected: Set<string> = this.selected();
        const info: WishlistInfo | null = this.wishlist_info();
        return info ? blocksOf(info).filter((block: WishlistBlock): boolean => selected.has(blockKey(block))).length : 0;
    });
    /** Uid des groupes dépliés, propre au visiteur. */
    protected readonly expanded_groups: WritableSignal<Set<string>> = signal(readExpandedGroups());
    /** Uid du groupe sur lequel l'objet glissé se déposerait, null hors de la moitié centrale d'une ligne de groupe. */
    protected readonly drop_group_uid: WritableSignal<string | null> = signal(null);
    /** Filtre par nom appliqué aux lignes et aux groupes. */
    private readonly name_filter: WritableSignal<string> = signal('');
    /** Une ligne cochée parmi plusieurs est en train d'être glissée : les autres lignes cochées sont grisées */
    protected readonly dragging_selection: WritableSignal<boolean> = signal(false);
    /** Objets présents deux fois dans une même zone : tant qu'il en reste, la liste n'est pas enregistrée. */
    protected readonly unsaved_duplicates: WritableSignal<string[]> = signal([]);
    protected datasource: MatTableDataSource<WishlistRow> = new MatTableDataSource();
    protected wishlist_filters_change: EventEmitter<void> = new EventEmitter();
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly document: Document = inject<Document>(DOCUMENT);
    private readonly api: ApiService = inject(ApiService);
    private readonly wishlist_services: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly sort: Signal<MatSort | undefined> = viewChild(MatSort);
    private readonly auto_save$: Subject<WishlistInfo> = new Subject();
    /** Ajouts envoyés à l'API et pas encore rechargés, par clé `${id}_${zone}` */
    private readonly pending_adds: WritableSignal<Set<string>> = signal(new Set());
    /** Dernière ligne cochée ou décochée, point de départ d'une plage Maj + clic */
    private selection_anchor: string | null = null;

    private readonly excel_headers: { [key: string]: { label: string, comment?: string } } = {
        id: { label: $localize`Identifiant` },
        name: { label: $localize`Nom de l'objet` },
        depot: {
            label: $localize`Zone de dépôt`,
            comment: `(0 : ${$localize`Banque`}, 1 : ${$localize`Zone de rappatriement`}, 2 : ${$localize`Non définie`})`
        },
        zone_x_pa: {
            label: $localize`Zone`,
            comment: `(0 : ${$localize`Banque`}, 1 : ${$localize`Zone de rappatriement`}, 2 : ${$localize`Non définie`})`
        },
        count: { label: $localize`Quantité souhaitée` },
        group: { label: $localize`Groupe` },
    };

    public constructor() {
        effect((): void => {
            const info: WishlistInfo | null = this.wishlist_info();
            const expanded: Set<string> = this.expanded_groups();
            const name_filter: string = this.name_filter();
            this.datasource.data = info ? buildWishlistRows(blocksOf(info), expanded, name_filter, this.locale) : [];
        });
        effect(() => {
            const sortInstance: MatSort | undefined = this.sort();
            if (sortInstance) {
                this.datasource.sort = sortInstance;
            }
        });
    }

    public ngOnInit(): void {

        if (this.is_readonly()) {
            this.edition_mode.set(false);
        }

        this.auto_save$
            .pipe(
                debounceTime(500),
                switchMap((info: WishlistInfo): Observable<WishlistInfo> => this.wishlist_services.updateWishlist(info).pipe(catchError((): Observable<never> => EMPTY))),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((updated: WishlistInfo): void => {
                const current_items: Item[] = this.items();
                updated.wishlist_items.forEach((item_in_list: WishlistItem): void => {
                    const item: Item | undefined = current_items.find((_item: Item): boolean => _item.id === item_in_list.item.id);
                    if (item) {
                        item_in_list.bank_count = item.bank_count;
                        item_in_list.item.bank_count = item.bank_count;
                    }
                });
                this.wishlist_info.set(updated);
            });

        this.wishlist_filters_change
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((): void => {
                this.datasource.filter = JSON.stringify(this.wishlist_filters());
                this.name_filter.set(this.wishlist_filters().items ?? '');
                this.clearSelection();
            });

        this.datasource.filterPredicate = (data: WishlistRow, filter: string): boolean => data.kind !== 'item' || this.customFilter(data.item, filter);

        this.getWishlist();

        this.api.getItems(true)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((items: Item[]): void => {
                this.items.set(items);
            });

        this.wishlist_services.getMyGroups()
            .pipe(catchError((): Observable<UserWishlistGroupDTO[]> => of([])), takeUntilDestroyed(this.destroy_ref))
            .subscribe((groups: UserWishlistGroupDTO[]): void => this.my_groups.set(groups));

        this.api.getItemEmotes()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((item_emotes: ItemEmotesDTO): void => {
                this.item_emotes.set(item_emotes);
            });
    }

    /**
     * Identité stable d'une ligne pour le mat-table.
     * Sans elle, chaque mise à jour (qui remplace toutes les WishlistItem par de nouvelles instances)
     * détruit et recrée toutes les lignes ; les cellules `@defer (on viewport)` repassent alors par leur
     * placeholder vide (clignotement en dev, liste vidée en prod jusqu'au scroll/F5).
     * La clé couvre lignes seules (item.id, zone_x_pa), groupes (uid) et membres (clé préfixée, sans collision avec une ligne seule).
     */
    protected trackByRow(_index: number, row: WishlistRow): string {
        return rowKey(row);
    }

    /** Donnée portée par le drag : l'objet, ou le groupe pour une ligne de groupe. */
    protected dragData(row: WishlistRow): WishlistItem | WishlistGroup {
        return row.kind === 'group' ? row.group : row.item;
    }

    /** Indique si la ligne est cochée. */
    protected isSelected(row: WishlistRow): boolean {
        return this.selected().has(rowKey(row));
    }

    /**
     * Applique le nouvel état de la case cliquée à sa ligne, ou avec Maj à toute la plage depuis la dernière case cliquée (ordre affiché).
     * Seuls les clics sur l'input comptent : la zone tactile de mat-checkbox déborde sans faire basculer la case.
     * Les membres d'un groupe ne se cochent pas : ils sont exclus de la plage.
     */
    protected selectRow(row: WishlistRow, checked: boolean, event: MouseEvent): void {
        if (!(event.target instanceof HTMLInputElement)) return;

        const visible: WishlistRow[] = this.datasource.filteredData.filter((visible_row: WishlistRow): boolean => visible_row.kind !== 'member');
        const row_index: number = visible.indexOf(row);
        const anchor_index: number = event.shiftKey && this.selection_anchor !== null
            ? visible.findIndex((visible_row: WishlistRow): boolean => rowKey(visible_row) === this.selection_anchor)
            : -1;
        const range: WishlistRow[] = anchor_index === -1 || row_index === -1
            ? [row]
            : visible.slice(Math.min(anchor_index, row_index), Math.max(anchor_index, row_index) + 1);

        this.selected.update((selected: Set<string>): Set<string> => {
            const next: Set<string> = new Set(selected);
            range.forEach((range_row: WishlistRow): void => {
                if (checked) {
                    next.add(rowKey(range_row));
                } else {
                    next.delete(rowKey(range_row));
                }
            });
            return next;
        });
        this.selection_anchor = rowKey(row);
    }

    /** Grise les autres lignes cochées quand la ligne glissée fait partie d'une sélection de plusieurs lignes. */
    protected startDrag(row: WishlistRow): void {
        this.drop_group_uid.set(null);
        this.dragging_selection.set(this.isSelected(row) && this.selected_count() > 1);
    }

    /**
     * Repère, pendant le drag d'un objet seul, la ligne de groupe survolée : le CDK ne gère pas le dépôt *sur* une ligne.
     * Seule la moitié centrale de la ligne vaut dépôt dans le groupe, ailleurs c'est un réordonnement.
     */
    protected trackDropTarget(row: WishlistRow, event: CdkDragMove): void {
        if (row.kind !== 'item') return;

        const hovered: Element | null = this.document.elementFromPoint(event.pointerPosition.x, event.pointerPosition.y);
        const target: HTMLElement | null = hovered?.closest<HTMLElement>('tr[data-group-uid]') ?? null;
        if (target === null) {
            this.drop_group_uid.set(null);
            return;
        }
        const bounds: DOMRect = target.getBoundingClientRect();
        const ratio: number = (event.pointerPosition.y - bounds.top) / bounds.height;
        this.drop_group_uid.set(ratio >= 0.25 && ratio <= 0.75 ? target.dataset['groupUid'] ?? null : null);
    }

    /**
     * Indique si la ligne est « satisfaite » : la quantité souhaitée est finie (>= 0)
     * et la quantité manquante (souhaité - banque - sacs) est nulle ou négative.
     * Ces lignes sont dévalorisées visuellement car l'objet n'a plus besoin d'être rapporté.
     */
    protected isFulfilled(row: WishlistRow): boolean {
        if (row.kind === 'group') return row.totals.needed !== null && row.totals.needed <= 0;
        if (row.kind === 'member') return false;
        return row.item.count >= 0 && (row.item.count - row.item.bank_count - row.item.bag_count) <= 0;
    }

    /** Construit le contenu du tooltip listant les citoyens dont le sac contient l'objet (un pseudo par ligne). */
    protected getBagCitizensTooltip(row: WishlistItem): string {
        return row.bag_citizens.join('\n');
    }

    /** Construit le contenu du tooltip listant les citoyens dont le coffre contient l'objet (un pseudo par ligne). */
    protected getChestCitizensTooltip(row: WishlistItem): string {
        return row.chest_citizens.join('\n');
    }

    protected changeZoneXPa(item: WishlistItem, new_zone: number): void {
        item.zone_x_pa = new_zone;
        this.triggerSave();
    }

    /**
     * Déclenche l'auto-save. Une paire (objet, zone) en double serait refusée par l'API (clé ville, objet, zone) :
     * l'enregistrement est suspendu et les objets concernés sont signalés jusqu'à correction.
     */
    protected triggerSave(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const duplicates: string[] = this.findDuplicateLabels(info.wishlist_items);
        this.unsaved_duplicates.set(duplicates);
        if (duplicates.length > 0) return;

        this.auto_save$.next(info);
    }

    /** Retire une ligne de la liste */
    protected remove(row: WishlistItem): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const updated_items: WishlistItem[] = [...info.wishlist_items];
        // La ligne elle-même, sinon la même paire (objet, zone) : un même objet peut figurer dans
        // plusieurs zones, retirer la première ligne de cet objet supprimait parfois la mauvaise.
        const same_row_index: number = updated_items.indexOf(row);
        const index: number = same_row_index !== -1
            ? same_row_index
            : updated_items.findIndex((wishlist_item: WishlistItem): boolean => wishlist_item.item.id === row.item.id && wishlist_item.zone_x_pa === row.zone_x_pa);
        if (index === -1) return;

        updated_items.splice(index, 1);
        this.wishlist_info.update((current: WishlistInfo | null): WishlistInfo => {
            current!.wishlist_items = updated_items;
            return new WishlistInfo(current?.modelToDto());
        });
        this.triggerSave();
    }

    /**
     * Ajoute l'objet dans la zone choisie puis recharge la liste. L'objet disparaît du menu d'ajout dès le clic :
     * un second ajout avant le rechargement serait un doublon refusé par l'API.
     */
    protected addItemToWishlist(item_id: number): void {
        const item: Item | undefined = this.items().find((_item: Item): boolean => _item.id === item_id);
        if (!item) return;

        const zone: number = this.current_zone_xp_pa_add_item();
        const key: string = `${item_id}_${zone}`;
        this.pending_adds.update((pending: Set<string>): Set<string> => new Set(pending).add(key));
        const release: () => void = (): void => this.pending_adds.update((pending: Set<string>): Set<string> => {
            const next: Set<string> = new Set(pending);
            next.delete(key);
            return next;
        });

        // ponytail: un rechargement par ajout ; si un ancien rechargement répond en dernier, il masque un ajout récent jusqu'au suivant. Sérialiser les rechargements si ça se voit.
        this.wishlist_services.addItemToWishlist(item, zone)
            .pipe(
                switchMap((): Observable<WishlistInfo> => this.wishlist_services.getWishlist()),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe({
                next: (wishlist_info: WishlistInfo): void => {
                    this.wishlist_info.set(wishlist_info);
                    release();
                },
                error: release
            });
    }

    /** Ajoute le groupe à la zone choisie, sans ses objets déjà placés (stock −1), puis affiche la liste à jour. */
    protected addGroup(key: string): void {
        const group: AddMenuGroup | undefined = this.add_groups().find((candidate: AddMenuGroup): boolean => candidate.key === key);
        if (!group) return;

        const ids: number[] = group.items.filter((item: Item): boolean => !group.placed_item_ids.has(item.id)).map((item: Item): number => item.id);
        if (ids.length === 0) return;

        this.wishlist_services.addGroupToWishlist(group.label, ids, this.current_zone_xp_pa_add_item(), -1)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((wishlist_info: WishlistInfo): void => this.wishlist_info.set(wishlist_info));
    }


    /** Objets déjà présents, sur une ligne ou dans un groupe, dans la zone donnée. */
    private placedIdsInZone(zone: number): Set<number> {
        return new Set((this.wishlist_info()?.wishlist_items ?? [])
            .filter((wishlist_item: WishlistItem): boolean => wishlist_item.zone_x_pa === zone)
            .map((wishlist_item: WishlistItem): number => wishlist_item.item.id));
    }

    /** Ouvre la fenêtre d'ajout avancé ; le résultat crée le groupe dans la liste, et dans mes groupes si demandé. */
    protected openAdvancedAdd(): void {
        this.openAdvancedDialog(null)
            .pipe(
                filter((result: WishlistAdvancedAddResult | undefined): result is WishlistAdvancedAddResult => result !== undefined),
                switchMap((result: WishlistAdvancedAddResult): Observable<unknown> => this.saveAdvancedGroup(result)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe();
    }

    /** Rouvre l'ajout avancé sur mon groupe (clé `user:<id>`) ; seul le groupe perso est mis à jour. */
    protected editGroup(key: string): void {
        const id: number = Number(key.replace('user:', ''));
        const group: UserWishlistGroupDTO | undefined = this.my_groups().find((candidate: UserWishlistGroupDTO): boolean => candidate.id === id);
        if (!group) return;

        this.openAdvancedDialog({ name: group.name, item_uids: group.itemUids })
            .pipe(
                filter((result: WishlistAdvancedAddResult | undefined): result is WishlistAdvancedAddResult => result !== undefined),
                switchMap((result: WishlistAdvancedAddResult): Observable<UserWishlistGroupDTO> =>
                    this.wishlist_services.updateMyGroup(id, result.name, this.uidsOf(result.item_ids))),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((updated: UserWishlistGroupDTO): void => this.my_groups.update((groups: UserWishlistGroupDTO[]): UserWishlistGroupDTO[] =>
                groups.map((candidate: UserWishlistGroupDTO): UserWishlistGroupDTO => candidate.id === id ? updated : candidate)));
    }

    /** Ouvre la fenêtre d'ajout avancé, en création (`edit` nul) ou en modification. */
    private openAdvancedDialog(edit: WishlistAdvancedAddData['edit']): Observable<WishlistAdvancedAddResult | undefined> {
        const zone: number = this.current_zone_xp_pa_add_item();
        return this.dialog
            .open<WishlistAdvancedAddComponent, WishlistAdvancedAddData, WishlistAdvancedAddResult>(WishlistAdvancedAddComponent, {
                data: { items: this.items(), placedIdsInZone: (target_zone: number): ReadonlySet<number> => this.placedIdsInZone(target_zone), zone, edit }
            })
            .afterClosed();
    }

    /** Crée mon groupe si demandé, et ajoute à la liste les objets non encore placés dans la zone choisie. */
    private saveAdvancedGroup(result: WishlistAdvancedAddResult): Observable<unknown> {
        const placed: Set<number> = this.placedIdsInZone(result.zone);
        const ids: number[] = result.item_ids.filter((id: number): boolean => !placed.has(id));
        const save$: Observable<unknown> = result.save_as_user_group
            ? this.wishlist_services.createMyGroup(result.name, this.uidsOf(result.item_ids))
                .pipe(
                    switchMap((created: UserWishlistGroupDTO): Observable<UserWishlistGroupDTO> => {
                        this.my_groups.update((groups: UserWishlistGroupDTO[]): UserWishlistGroupDTO[] => [...groups, created]);
                        return of(created);
                    }),
                    catchError((): Observable<null> => of(null))
                )
            : of(null);
        const add$: Observable<unknown> = ids.length > 0
            ? this.wishlist_services.addGroupToWishlist(result.name, ids, result.zone, result.count)
                .pipe(switchMap((wishlist_info: WishlistInfo): Observable<WishlistInfo> => {
                    this.wishlist_info.set(wishlist_info);
                    return of(wishlist_info);
                }))
            : of(null);
        return add$.pipe(switchMap((): Observable<unknown> => save$));
    }

    /** uid des objets donnés par id, dans l'ordre de la banque. */
    private uidsOf(item_ids: readonly number[]): string[] {
        return this.items().filter((item: Item): boolean => item_ids.includes(item.id)).map((item: Item): string => item.uid);
    }
    /** Supprime mon groupe (clé `user:<id>`), après confirmation. */
    protected deleteGroup(key: string): void {
        const id: number = Number(key.replace('user:', ''));
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Supprimer ce groupe ?`
                }
            })
            .afterClosed()
            .pipe(
                filter((confirm: boolean): boolean => confirm),
                switchMap((): Observable<void> => this.wishlist_services.deleteMyGroup(id)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((): void => this.my_groups.update((groups: UserWishlistGroupDTO[]): UserWishlistGroupDTO[] =>
                groups.filter((group: UserWishlistGroupDTO): boolean => group.id !== id)));
    }

    /**
     * Déplace le bloc déposé (ligne seule ou groupe avec ses objets), ou toute la sélection si elle en fait partie : les blocs déplacés
     * se suivent, dans leur ordre, entre les lignes affichées qui encadrent le point de dépôt. Les index du CDK portent sur les lignes
     * affichées (filtrées, membres compris). Un objet seul lâché sur une ligne de groupe rejoint ce groupe.
     */
    protected sortWishlist(event: CdkDragDrop<MatTableDataSource<WishlistRow>>): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const dragged: WishlistItem | WishlistGroup = event.item.data as WishlistItem | WishlistGroup;
        const drop_uid: string | null = this.drop_group_uid();
        this.drop_group_uid.set(null);

        const dragged_key: string = dragged instanceof WishlistGroup ? groupKey(dragged) : wishlistItemKey(dragged);
        const moves_selection: boolean = this.selected().has(dragged_key);
        const moving_keys: Set<string> = moves_selection ? this.selected() : new Set([dragged_key]);
        const isStill: (row: WishlistRow) => boolean = (row: WishlistRow): boolean => !moving_keys.has(ownerKey(row));
        const joining: WishlistItem[] = joiningItems(info, moving_keys);

        const drop_target: WishlistGroup | undefined = info.groups.find((group: WishlistGroup): boolean => group.uid === drop_uid);
        if (drop_target && joining.length > 0) {
            this.joinItems(joining, drop_target);
            return;
        }

        const visible: WishlistRow[] = this.datasource.filteredData;
        const moving_down: boolean = event.currentIndex > event.previousIndex;
        const split: number = moving_down ? event.currentIndex + 1 : event.currentIndex;
        const last_before: WishlistRow | undefined = visible.slice(0, split).filter(isStill).at(-1);
        const first_after: WishlistRow | undefined = visible.slice(split).find(isStill);

        const surrounding_group: WishlistGroup | null = groupAroundSlot(last_before, first_after);
        if (surrounding_group !== null && joining.length > 0) {
            this.joinItems(joining, surrounding_group);
            return;
        }

        const blocks: WishlistBlock[] = blocksOf(info);
        const moved: WishlistBlock[] = blocks.filter((block: WishlistBlock): boolean => moving_keys.has(blockKey(block)));
        const rest: WishlistBlock[] = blocks.filter((block: WishlistBlock): boolean => !moving_keys.has(blockKey(block)));
        const insert_after_last_before: boolean = (moving_down && last_before !== undefined) || first_after === undefined;
        const anchor: WishlistRow | undefined = insert_after_last_before ? last_before : first_after;
        const anchor_index: number = anchor === undefined ? -1 : rest.findIndex((block: WishlistBlock): boolean => blockKey(block) === ownerKey(anchor));
        const insert_at: number = anchor_index === -1 ? 0 : anchor_index + (insert_after_last_before ? 1 : 0);
        rest.splice(insert_at, 0, ...moved);
        if (moves_selection) {
            this.clearSelection();
        }

        resetBlockPriorities(rest);
        this.refresh();
    }

    /** Réglages d'un groupe modifiés : ils sont recopiés sur ses objets, les priorités recalculées (le dépôt en dépend) et la liste enregistrée. */
    protected changeGroupSettings(group: WishlistGroup): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        resetBlockPriorities(blocksOf(info));
        info.applyGroupSettings(group);
        this.refresh();
    }

    /** Fixe la zone du groupe (0 : infinie) ; une saisie vidée est ignorée. */
    protected setGroupZone(group: WishlistGroup, zone: number | null): void {
        if (zone === null) return;
        group.zone_x_pa = zone;
        this.changeGroupSettings(group);
    }

    /** Fixe le stock souhaité du groupe (-1 : infini) ; une saisie vidée est ignorée. */
    protected setGroupCount(group: WishlistGroup, count: number | null): void {
        if (count === null) return;
        group.count = count;
        this.changeGroupSettings(group);
    }

    /** Déplie ou replie un groupe et mémorise l'état. */
    protected toggleGroup(uid: string): void {
        this.expanded_groups.update((expanded: Set<string>): Set<string> => {
            const next: Set<string> = new Set(expanded);
            if (!next.delete(uid)) {
                next.add(uid);
            }
            return next;
        });
        this.persistExpandedGroups();
    }

    /** Déplie ou replie tous les groupes et mémorise l'état. */
    protected setAllGroupsExpanded(expanded: boolean): void {
        const uids: string[] = expanded ? (this.wishlist_info()?.groups ?? []).map((group: WishlistGroup): string => group.uid) : [];
        this.expanded_groups.set(new Set(uids));
        this.persistExpandedGroups();
    }

    /**
     * Sort un objet de son groupe : il redevient une ligne seule juste après le groupe (stock ∞ comme un ajout unitaire ; zone, dépôt et signalement conservés).
     * Un groupe vidé est supprimé, l'objet prend alors sa place.
     */
    protected takeOutOfGroup(item: WishlistItem): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info || item.group_uid === null) return;

        const group_uid: string = item.group_uid;
        item.group_uid = null;
        item.count = -1;
        const blocks: WishlistBlock[] = blocksOf(info).filter((block: WishlistBlock): boolean => block.kind !== 'item' || block.item !== item);
        const group_index: number = blocks.findIndex((block: WishlistBlock): boolean => block.kind === 'group' && block.group.uid === group_uid);
        const group_block: WishlistBlock | undefined = blocks[group_index];
        const is_emptied: boolean = group_block?.kind === 'group' && group_block.members.length === 0;
        if (is_emptied) {
            info.groups = info.groups.filter((group: WishlistGroup): boolean => group.uid !== group_uid);
            blocks.splice(group_index, 1, { kind: 'item', item });
        } else {
            blocks.splice(group_index + 1, 0, { kind: 'item', item });
        }
        resetBlockPriorities(blocks);
        this.refresh();
    }

    /** Supprime le groupe et tous ses objets, après confirmation. */
    protected removeGroup(group: WishlistGroup): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Supprimer ce groupe et tous ses objets de la liste ?`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((confirm: boolean): void => {
                const info: WishlistInfo | null = this.wishlist_info();
                if (!confirm || !info) return;

                info.wishlist_items = info.wishlist_items.filter((item: WishlistItem): boolean => item.group_uid !== group.uid);
                info.groups = info.groups.filter((candidate: WishlistGroup): boolean => candidate.uid !== group.uid);
                this.refresh();
            });
    }

    /** Rattache un objet seul au groupe : il prend sa zone, son dépôt, sa priorité et son stock. */
    protected joinGroup(item: WishlistItem, group: WishlistGroup): void {
        this.joinItems([item], group);
    }

    /** Fait rejoindre le groupe aux objets seuls donnés, en une seule mise à jour ; la sélection est vidée. */
    private joinItems(items: readonly WishlistItem[], group: WishlistGroup): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        items.forEach((item: WishlistItem): void => {
            item.group_uid = group.uid;
        });
        info.applyGroupSettings(group);
        this.clearSelection();
        this.refresh();
    }

    protected changeDepot(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        resetBlockPriorities(blocksOf(info));
        this.refresh();
    }

    protected changeEditionMode(): void {
        localStorage.setItem(WISHLIST_EDITION_MODE_KEY, JSON.stringify(this.edition_mode()));
    }

    protected compareWith(option: WishlistDepot, selected: WishlistDepot): boolean {
        return option.value.count === selected.value.count;
    }

    protected shareWishlistForum(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        let text: string = `[big][b][i]${$localize`Liste de courses`}[/i][/b][/big]\n\n`;

        const blocks: WishlistBlock[] = blocksOf(info);
        const to_bring_back: WishlistBlock[] = blocks.filter((block: WishlistBlock): boolean => this.blockOwner(block).priority >= 0);
        const heavy: WishlistBlock[] = to_bring_back.filter((block: WishlistBlock): boolean => this.isHeavyBlock(block));
        const light: WishlistBlock[] = to_bring_back.filter((block: WishlistBlock): boolean => !this.isHeavyBlock(block));
        const do_not_bring_back: WishlistBlock[] = blocks.filter((block: WishlistBlock): boolean => this.blockOwner(block).priority < 0);

        const legend: string[] = [];
        if (to_bring_back.some((block: WishlistBlock): boolean => this.blockOwner(block).depot.value.count === WishlistDepot.TELEPORT.value.count)) {
            legend.push(`[i]${WishlistDepot.TELEPORT.value.label}[/i]`);
        }
        if (to_bring_back.some((block: WishlistBlock): boolean => this.blockItems(block).some((item: WishlistItem): boolean => item.should_signal))) {
            legend.push(`[bad]${$localize`Objet à signaler`}[/bad]:warning:`);
        }
        if (legend.length > 0) {
            text += `${$localize`Légende`} : ${legend.join(' · ')}\n`;
        }
        if (heavy.length > 0) {
            text += `\n[collapse=${$localize`Encombrants`}]\n`;
            heavy.forEach((block: WishlistBlock): void => {
                text += this.forumBlockLine(block);
            });
            text += '[/collapse]\n';
        }
        if (light.length > 0) {
            text += `\n[collapse=${$localize`Non-Encombrants`}]\n`;
            light.forEach((block: WishlistBlock): void => {
                text += this.forumBlockLine(block);
            });
            text += '[/collapse]\n';
        }
        if (do_not_bring_back.length > 0) {
            text += `\n[collapse=${$localize`Ne pas rapporter`}]\n`;
            do_not_bring_back.forEach((block: WishlistBlock): void => {
                text += block.kind === 'item'
                    ? `:middot:${this.forumLabel(block.item.item)}\n`
                    : `:middot:${block.group.name} : ${this.forumGroupTags(block.members)}\n`;
            });
            text += '[/collapse]\n';
        }
        text += '\n{hr}\n\n';
        text += `[b]${$localize`Dernière mise à jour` + ' : ' + info.update_info.update_time.format('LLL') + ' ' + $localize`par` + ' ' + info.update_info.username}[/b]\n`;
        text += `[aparte]${$localize`Cette liste a été générée à partir du site MyHordes Optimizer. Vous pouvez la retrouver en suivant [link=${environment.website_url}my-town/wishlist]ce lien[/link]`}[/aparte]`;

        this.clipboard.copy(text, $localize`La liste a bien été copiée au format forum`);
    }

    /** Ligne ou groupe portant priorité, dépôt et zone d'un bloc. */
    private blockOwner(block: WishlistBlock): WishlistItem | WishlistGroup {
        return block.kind === 'item' ? block.item : block.group;
    }

    /** Lignes d'objets d'un bloc. */
    private blockItems(block: WishlistBlock): WishlistItem[] {
        return block.kind === 'item' ? [block.item] : block.members;
    }

    /** Un bloc est encombrant si tous ses objets le sont. */
    private isHeavyBlock(block: WishlistBlock): boolean {
        const items: WishlistItem[] = this.blockItems(block);
        return items.length > 0 && items.every((item: WishlistItem): boolean => item.item.is_heaver);
    }

    /** Ligne forum d'un bloc à rapporter. */
    private forumBlockLine(block: WishlistBlock): string {
        return block.kind === 'item' ? this.forumLine(block.item) : this.forumGroupLine(block.group, block.members);
    }

    /** Balises des membres d'un groupe (nom si l'objet n'en a pas), les objets signalés en [bad]. */
    private forumGroupTags(members: readonly WishlistItem[]): string {
        return members.map((member: WishlistItem): string => {
            const tag: string = this.item_emotes()[member.item.uid] ?? member.item.label[this.locale];
            return member.should_signal ? `[bad]${tag}[/bad]` : tag;
        }).join(' ');
    }

    /**
     * Ligne d'un groupe à rapporter au format forum : balises de ses objets, stock et zone sur une seule ligne.
     * @param {WishlistGroup} group Groupe.
     * @param {readonly WishlistItem[]} members Objets du groupe.
     * @returns {string} Texte, retour à la ligne compris.
     */
    private forumGroupLine(group: WishlistGroup, members: readonly WishlistItem[]): string {
        let label: string = `${group.name} : ${this.forumGroupTags(members)}` + (group.count >= 0 ? ` (x${group.count})` : '')
            + (group.zone_x_pa > 0 ? ` – ${$localize`zone`} ${group.zone_x_pa}:ap:` : '');
        if (group.depot.value.count === WishlistDepot.TELEPORT.value.count) {
            label = `[i]${label}[/i]`;
        }
        return `:middot:${label}${members.some((member: WishlistItem): boolean => member.should_signal) ? ':warning:' : ''}\n`;
    }

    /**
     * Ligne d'un objet à rapporter au format forum, terminée par sa zone si elle n'est pas infinie,
     * en italique si à déposer dans la zone de rapatriement.
     * @param {WishlistItem} item Ligne de la liste.
     * @returns {string} Texte, retour à la ligne compris.
     */
    private forumLine(item: WishlistItem): string {
        let label: string = this.forumLabel(item.item) + (item.count >= 0 ? ` (x${item.count})` : '')
            + (item.zone_x_pa > 0 ? ` – ${$localize`zone`} ${item.zone_x_pa}:ap:` : '');
        if (item.depot.value.count === WishlistDepot.TELEPORT.value.count) {
            label = `[i]${label}[/i]`;
        }
        return item.should_signal ? `[bad]:middot:${label}[/bad]:warning:\n` : `:middot:${label}\n`;
    }

    /**
     * Nom d'un objet au format forum, précédé de sa balise quand le jeu en a une.
     * @param {Item} item Objet.
     * @returns {string} Texte.
     */
    private forumLabel(item: Item): string {
        const emote: string | undefined = this.item_emotes()[item.uid];
        const label: string = item.label[this.locale];
        return emote === undefined ? label : `${emote} ${label}`;
    }

    protected shareExcel(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const workbook: WorkBook = {
            Props: { Author: 'MyHordes Optimizer', Title: `MyHordes Optimizer - ${$localize`Liste de course`}` },
            Sheets: {},
            SheetNames: []
        };

        const data: WorkSheet = utils.json_to_sheet(this.buildExcelRows(info.wishlist_items, info.groups), { cellStyles: true });
        workbook.SheetNames.push($localize`Liste de courses`);
        workbook.Sheets[$localize`Liste de courses`] = data;

        const u8: Uint8Array = write(workbook, { type: 'buffer', bookType: 'xlsx' });
        /** xlsx.write() ne produit jamais de buffer partagé */
        const blob: Blob = new Blob([u8 as Uint8Array<ArrayBuffer>], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url: string = URL.createObjectURL(blob);
        const hidden_link: HTMLAnchorElement = this.document.createElement('a');
        this.document.body.appendChild(hidden_link);
        hidden_link.style.display = 'none';
        hidden_link.href = url;
        hidden_link.download = `MyHordes Optimizer - ${$localize`Liste de courses`}`;
        hidden_link.click();
        hidden_link.remove();
        URL.revokeObjectURL(url);
    }

    protected importExcel(element: HTMLInputElement): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Voulez-vous écraser la liste actuelle ? Elle sera perdue.`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((confirm: boolean): void => {
                if (!confirm || !element?.files?.length) return;

                const file: File = element.files[0];
                const info: WishlistInfo | null = this.wishlist_info();
                if (!info) return;

                file.arrayBuffer().then((data: ArrayBuffer): void => {
                    const workbook: WorkBook = read(data);
                    const new_wishlist: WishlistInfo = this.rowsToWishlist(utils.sheet_to_json(workbook.Sheets[$localize`Liste de courses`]));
                    new_wishlist.update_info = info.update_info;
                    if (new_wishlist.wishlist_items.length) {
                        this.wishlist_info.set(new_wishlist);
                        this.triggerSave();
                    }
                });
            });
    }

    /**
     * Lignes de l'export Excel, relues telles quelles par {@link rowsToWishlist}. La quantité est celle de la ligne
     * (`count`) : `item.wishlist_count` vient de la première ligne de l'objet dans la ville, quelle que soit sa zone.
     */
    protected buildExcelRows(items: WishlistItem[], groups: readonly WishlistGroup[] = []): ExcelRow[] {
        return items.map((item: WishlistItem): ExcelRow => ({
            [this.excel_headers['id'].label]: item.item.id,
            [this.excel_headers['name'].label]: item.item.label[this.locale],
            [this.excel_headers['depot'].label]: item.depot.value.count,
            [this.excel_headers['zone_x_pa'].label]: item.zone_x_pa,
            [this.excel_headers['count'].label]: item.count,
            [this.excel_headers['group'].label]: groups.find((group: WishlistGroup): boolean => group.uid === item.group_uid)?.name ?? ''
        }));
    }

    /**
     * Liste reconstruite à partir des lignes d'un fichier Excel ; les lignes de même nom et de même zone forment un groupe
     * dont zone, dépôt et stock sont ceux de sa première ligne. Les objets inconnus sont ignorés.
     * @param {ExcelRow[]} rows Lignes du fichier.
     * @returns {WishlistInfo} Liste, sans informations de mise à jour.
     */
    protected rowsToWishlist(rows: ExcelRow[]): WishlistInfo {
        const current_items: Item[] = this.items();
        const blocks: WishlistBlock[] = [];
        const group_blocks: Map<string, Extract<WishlistBlock, { kind: 'group' }>> = new Map();
        rows.forEach((row: ExcelRow, index: number): void => {
            const complete_item: Item | undefined = current_items.find((item_in_all: Item): boolean => item_in_all.id === row[this.excel_headers['id'].label]);
            if (!complete_item) return;
            const new_item: WishlistItem = new WishlistItem();
            new_item.depot = WishlistDepot.getDepotFromCountAndPriority(<number>row[this.excel_headers['depot'].label], 1000 - index);
            new_item.zone_x_pa = <number>row[this.excel_headers['zone_x_pa'].label];
            new_item.count = <number>row[this.excel_headers['count'].label];
            new_item.priority = 1000 - index;
            new_item.item = complete_item;
            new_item.bank_count = complete_item.bank_count;
            const group_name: string = String(row[this.excel_headers['group'].label] ?? '').trim();
            if (group_name === '') {
                blocks.push({ kind: 'item', item: new_item });
                return;
            }
            const group_key: string = `${new_item.zone_x_pa}|${group_name}`;
            let block: Extract<WishlistBlock, { kind: 'group' }> | undefined = group_blocks.get(group_key);
            if (!block) {
                const group: WishlistGroup = new WishlistGroup();
                group.uid = newGroupUid();
                group.name = group_name;
                group.priority = new_item.priority;
                group.zone_x_pa = new_item.zone_x_pa;
                group.depot = new_item.depot;
                group.count = new_item.count;
                block = { kind: 'group', group, members: [] };
                group_blocks.set(group_key, block);
                blocks.push(block);
            }
            new_item.group_uid = block.group.uid;
            block.members.push(new_item);
        });
        resetBlockPriorities(blocks);
        const wishlist: WishlistInfo = new WishlistInfo();
        wishlist.groups = [...group_blocks.values()].map((block: Extract<WishlistBlock, { kind: 'group' }>): WishlistGroup => block.group);
        wishlist.wishlist_items = blocks
            .flatMap((block: WishlistBlock): WishlistItem[] => this.blockItems(block))
            .sort((item_a: WishlistItem, item_b: WishlistItem): number => item_b.priority - item_a.priority);
        wishlist.groups.forEach((group: WishlistGroup): void => wishlist.applyGroupSettings(group));
        return wishlist;
    }

    /** Libellés, sans répétition, des objets présents au moins deux fois dans la même zone. */
    private findDuplicateLabels(items: WishlistItem[]): string[] {
        const seen: Set<string> = new Set<string>();
        const labels: Set<string> = new Set<string>();
        for (const item of items) {
            const key: string = `${item.item.id}_${item.zone_x_pa}`;
            if (seen.has(key)) {
                labels.add(item.item.label[this.locale]);
            } else {
                seen.add(key);
            }
        }
        return [...labels];
    }

    /** Reconstruit la liste à partir de son état courant (tri par priorité) puis la sauvegarde. */
    private refresh(): void {
        this.wishlist_info.update((current: WishlistInfo | null): WishlistInfo => new WishlistInfo(current?.modelToDto()));
        this.triggerSave();
    }

    /** Mémorise les groupes dépliés. */
    private persistExpandedGroups(): void {
        localStorage.setItem(WISHLIST_EXPANDED_GROUPS_KEY, JSON.stringify([...this.expanded_groups()]));
    }

    /** Décoche toutes les lignes. */
    private clearSelection(): void {
        this.selected.set(new Set());
        this.selection_anchor = null;
    }

    private customFilter(data: WishlistItem, filter: string): boolean {
        const filter_object: WishlistFilters = JSON.parse(filter.toLowerCase());
        if (!filter_object || ((!filter_object.items || filter_object.items === '') && !filter_object.depot)) return true;
        if (data.item.label[this.locale].toLocaleLowerCase().indexOf(filter_object.items.toLocaleLowerCase()) > -1) return true;
        return false;
    }

    private getWishlist(): void {
        this.wishlist_services.getWishlist()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((wishlist_info: WishlistInfo): void => {
                this.wishlist_info.set(wishlist_info);
            });
    }
}

/** Clé d'un groupe dans la sélection. */
function groupKey(group: WishlistGroup): string {
    return `group:${group.uid}`;
}

/** Clé d'un bloc dans la sélection. */
function blockKey(block: WishlistBlock): string {
    return block.kind === 'group' ? groupKey(block.group) : wishlistItemKey(block.item);
}

/** Clé du bloc auquel appartient une ligne affichée (un membre appartient au bloc de son groupe). */
function ownerKey(row: WishlistRow): string {
    return row.kind === 'item' ? wishlistItemKey(row.item) : groupKey(row.group);
}

/** Objets seuls déplacés pouvant rejoindre un groupe ; aucun si un groupe fait partie du déplacement (pas de groupe dans un groupe). */
function joiningItems(info: WishlistInfo, moving_keys: ReadonlySet<string>): WishlistItem[] {
    const moves_a_group: boolean = info.groups.some((group: WishlistGroup): boolean => moving_keys.has(groupKey(group)));
    if (moves_a_group) return [];
    return info.wishlist_items.filter((item: WishlistItem): boolean => item.group_uid === null && moving_keys.has(wishlistItemKey(item)));
}

/** Groupe déplié dont l'emplacement de dépôt est à l'intérieur (sous sa ligne ou entre deux de ses objets), sinon null. */
function groupAroundSlot(last_before: WishlistRow | undefined, first_after: WishlistRow | undefined): WishlistGroup | null {
    if (first_after?.kind !== 'member') return null;
    const inside: boolean = (last_before?.kind === 'member' || last_before?.kind === 'group') && last_before.group.uid === first_after.group.uid;
    return inside ? first_after.group : null;
}

/** Identité d'une ligne affichée : les membres sont préfixés pour ne jamais entrer en collision avec une ligne seule. */
function rowKey(row: WishlistRow): string {
    if (row.kind === 'group') return groupKey(row.group);
    return row.kind === 'member' ? `member:${wishlistItemKey(row.item)}` : wishlistItemKey(row.item);
}

/** Uid des groupes dépliés mémorisés, ensemble vide si le stockage est absent ou illisible. */
function readExpandedGroups(): Set<string> {
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(WISHLIST_EXPANDED_GROUPS_KEY) ?? '[]');
        return new Set(Array.isArray(stored) ? stored.filter((uid: unknown): uid is string => typeof uid === 'string') : []);
    } catch {
        return new Set();
    }
}

interface WishlistFilters {
    items: string;
    depot: WishlistDepot[];
}

type ExcelRow = Record<string, string | number>;
