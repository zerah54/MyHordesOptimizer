import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { Observable, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { read, utils, WorkBook, WorkSheet, write } from 'xlsx';

import { environment } from '../../../environments/environment';
import { HORDES_IMG_REPO, WISHLIST_EDITION_MODE_KEY } from '../../_abstract_model/const';
import { WishlistDepot } from '../../_abstract_model/enum/wishlist-depot.enum';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { Imports, ListForAddRemove } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { TypedCellDefDirective } from '../../_core/directives/typed-cell-def.directive';
import { ColumnIdPipe } from '../../_core/pipes/column-id.pipe';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { DeferredCellComponent } from '../../_shared/deferred-cell/deferred-cell.component';
import { LastUpdateComponent } from '../../_shared/last-update/last-update.component';
import { MenuAddComponent } from '../../_shared/list-elements-add-remove/menu-add/menu-add.component';
import { HeaderWithStringFilterComponent } from '../../_shared/lists/header-with-string-filter/header-with-string-filter.component';
import { ItemAlreadyInListPipe } from './item-already-in-list.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [DeferredCellComponent, HeaderWithStringFilterComponent, LastUpdateComponent, MenuAddComponent];
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
    protected wishlist_filters: WritableSignal<WishlistFilters> = signal({ items: '', depot: [] });
    protected current_zone_xp_pa_add_item: WritableSignal<number> = signal(0);
    protected readonly add_label: string = $localize`Ajouter à la liste de courses`;
    /** Objets proposés par le menu d'ajout : ceux absents de la zone choisie et sans ajout en cours */
    protected readonly add_lists: Signal<ListForAddRemove[]> = computed((): ListForAddRemove[] => {
        const zone: number = this.current_zone_xp_pa_add_item();
        const pending: Set<string> = this.pending_adds();
        const in_zone: Set<number> = new Set((this.wishlist_info()?.wishlist_items ?? [])
            .filter((wishlist_item: WishlistItem): boolean => wishlist_item.zone_x_pa === zone)
            .map((wishlist_item: WishlistItem): number => wishlist_item.item.id));
        return [{
            label: '',
            list: this.items().filter((item: Item): boolean => !in_zone.has(item.id) && !pending.has(`${item.id}_${zone}`))
        }];
    });
    /** Lignes cochées, par clé {@link wishlistItemKey} */
    protected readonly selected: WritableSignal<Set<string>> = signal(new Set());
    /** Nombre de lignes cochées encore présentes dans la liste */
    protected readonly selected_count: Signal<number> = computed((): number => {
        const selected: Set<string> = this.selected();
        return (this.wishlist_info()?.wishlist_items ?? []).filter((row: WishlistItem): boolean => selected.has(wishlistItemKey(row))).length;
    });
    /** Une ligne cochée parmi plusieurs est en train d'être glissée : les autres lignes cochées sont grisées */
    protected readonly dragging_selection: WritableSignal<boolean> = signal(false);
    /** Objets présents deux fois dans une même zone : tant qu'il en reste, la liste n'est pas enregistrée. */
    protected readonly unsaved_duplicates: WritableSignal<string[]> = signal([]);
    protected datasource: MatTableDataSource<WishlistItem> = new MatTableDataSource();
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
    };

    public constructor() {
        effect((): void => {
            const info: WishlistInfo | null = this.wishlist_info();
            this.datasource.data = info ? [...info.wishlist_items] : [];
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
                switchMap((info: WishlistInfo) => this.wishlist_services.updateWishlist(info)),
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
                this.clearSelection();
            });

        this.datasource.filterPredicate = (data: WishlistItem, filter: string): boolean => this.customFilter(data, filter);

        this.getWishlist();

        this.api.getItems(true)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((items: Item[]): void => {
                this.items.set(items);
            });
    }

    /**
     * Identité stable d'une ligne pour le mat-table.
     * Sans elle, chaque mise à jour (qui remplace toutes les WishlistItem par de nouvelles instances)
     * détruit et recrée toutes les lignes ; les cellules `@defer (on viewport)` repassent alors par leur
     * placeholder vide (clignotement en dev, liste vidée en prod jusqu'au scroll/F5).
     * La clé (item.id, zone_x_pa) est l'identité utilisée partout ailleurs dans ce composant.
     */
    protected trackByWishlistItem(_index: number, row: WishlistItem): string {
        return wishlistItemKey(row);
    }

    /** Indique si la ligne est cochée. */
    protected isSelected(row: WishlistItem): boolean {
        return this.selected().has(wishlistItemKey(row));
    }

    /**
     * Applique le nouvel état de la case cliquée à sa ligne, ou avec Maj à toute la plage depuis la dernière case cliquée (ordre affiché).
     * Seuls les clics sur l'input comptent : la zone tactile de mat-checkbox déborde sans faire basculer la case.
     */
    protected selectRow(row: WishlistItem, checked: boolean, event: MouseEvent): void {
        if (!(event.target instanceof HTMLInputElement)) return;

        const visible: WishlistItem[] = this.datasource.filteredData;
        const row_index: number = visible.indexOf(row);
        const anchor_index: number = event.shiftKey && this.selection_anchor !== null
            ? visible.findIndex((visible_row: WishlistItem): boolean => wishlistItemKey(visible_row) === this.selection_anchor)
            : -1;
        const range: WishlistItem[] = anchor_index === -1 || row_index === -1
            ? [row]
            : visible.slice(Math.min(anchor_index, row_index), Math.max(anchor_index, row_index) + 1);

        this.selected.update((selected: Set<string>): Set<string> => {
            const next: Set<string> = new Set(selected);
            range.forEach((range_row: WishlistItem): void => {
                if (checked) {
                    next.add(wishlistItemKey(range_row));
                } else {
                    next.delete(wishlistItemKey(range_row));
                }
            });
            return next;
        });
        this.selection_anchor = wishlistItemKey(row);
    }

    /** Grise les autres lignes cochées quand la ligne glissée fait partie d'une sélection de plusieurs lignes. */
    protected startDrag(row: WishlistItem): void {
        this.dragging_selection.set(this.isSelected(row) && this.selected_count() > 1);
    }

    /**
     * Indique si la ligne est « satisfaite » : la quantité souhaitée est finie (>= 0)
     * et la quantité manquante (souhaité - banque - sacs) est nulle ou négative.
     * Ces lignes sont dévalorisées visuellement car l'objet n'a plus besoin d'être rapporté.
     */
    protected isFulfilled(row: WishlistItem): boolean {
        return row.count >= 0 && (row.count - row.bank_count - row.bag_count) <= 0;
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

    /**
     * Déplace la ligne déposée, ou toute la sélection si elle en fait partie : les lignes déplacées se suivent, dans leur ordre,
     * entre les lignes affichées qui encadrent le point de dépôt. Les index du CDK portent sur les lignes affichées (filtrées).
     */
    protected sortWishlist(event: CdkDragDrop<MatTableDataSource<WishlistItem>>): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const dragged_key: string = wishlistItemKey(event.item.data);
        const moves_selection: boolean = this.selected().has(dragged_key);
        const moving_keys: Set<string> = moves_selection ? this.selected() : new Set([dragged_key]);
        const isStill: (row: WishlistItem) => boolean = (row: WishlistItem): boolean => !moving_keys.has(wishlistItemKey(row));

        const visible: WishlistItem[] = this.datasource.filteredData;
        const moving_down: boolean = event.currentIndex > event.previousIndex;
        const split: number = moving_down ? event.currentIndex + 1 : event.currentIndex;
        const last_before: WishlistItem | undefined = visible.slice(0, split).filter(isStill).at(-1);
        const first_after: WishlistItem | undefined = visible.slice(split).find(isStill);

        const block: WishlistItem[] = visible.filter((row: WishlistItem): boolean => !isStill(row));
        const current_wishlist_items: WishlistItem[] = info.wishlist_items.filter((row: WishlistItem): boolean => !block.includes(row));
        const insert_after_last_before: boolean = (moving_down && last_before !== undefined) || first_after === undefined;
        const insert_at: number = insert_after_last_before
            ? (last_before !== undefined ? current_wishlist_items.indexOf(last_before) + 1 : 0)
            : current_wishlist_items.indexOf(first_after as WishlistItem);
        current_wishlist_items.splice(insert_at, 0, ...block);
        if (moves_selection) {
            this.clearSelection();
        }

        const sorted: WishlistItem[] = this.resetPriorities(current_wishlist_items);
        this.wishlist_info.update((current: WishlistInfo | null): WishlistInfo => {
            current!.wishlist_items = sorted;
            return new WishlistInfo(current?.modelToDto());
        });
        this.triggerSave();
    }

    protected changeDepot(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const sorted: WishlistItem[] = this.resetPriorities([...info.wishlist_items]);
        this.wishlist_info.update((current: WishlistInfo | null): WishlistInfo => {
            current!.wishlist_items = sorted;
            return new WishlistInfo(current?.modelToDto());
        });
        this.triggerSave();
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

        const heavy: WishlistItem[] = info.wishlist_items.filter((item: WishlistItem): boolean => item.item.is_heaver && item.priority >= 0);
        const light: WishlistItem[] = info.wishlist_items.filter((item: WishlistItem): boolean => !item.item.is_heaver && item.priority >= 0);
        const do_not_bring_back: WishlistItem[] = info.wishlist_items.filter((item: WishlistItem): boolean => item.priority < 0);

        if (heavy.length > 0) {
            text += `\n[collapse=${$localize`Encombrants`}]\n`;
            heavy.forEach((item: WishlistItem): void => {
                text += item.should_signal ? '[bad]' : '';
                text += `:middot:${item.item.label[this.locale]}` + (item.count >= 0 ? ` (x${item.count})` : '') + (item.depot.value.count === 1 ? `[i]${$localize`Zone de rappatriement`}[/i]` : '');
                text += item.should_signal ? '[/bad]:warning:\n' : '\n';
            });
            text += '[/collapse]\n';
        }
        if (light.length > 0) {
            text += `\n[collapse=${$localize`Non-Encombrants`}]\n`;
            light.forEach((item: WishlistItem): void => {
                text += item.should_signal ? '[bad]' : '';
                text += `:middot:${item.item.label[this.locale]}` + (item.count >= 0 ? ` (x${item.count})` : '') + (item.depot.value.count === 1 ? `[i]${$localize`Zone de rappatriement`}[/i]` : '');
                text += item.should_signal ? '[/bad]:warning:\n' : '\n';
            });
            text += '[/collapse]\n';
        }
        if (do_not_bring_back.length > 0) {
            text += `\n[collapse=${$localize`Ne pas rapporter`}]\n`;
            do_not_bring_back.forEach((item: WishlistItem): void => {
                text += `:middot:${item.item.label[this.locale]}\n`;
            });
            text += '[/collapse]\n';
        }
        text += '\n{hr}\n\n';
        text += `[b]${$localize`Dernière mise à jour` + ' : ' + info.update_info.update_time.format('LLL') + ' ' + $localize`par` + ' ' + info.update_info.username}[/b]\n`;
        text += `[aparte]${$localize`Cette liste a été générée à partir du site MyHordes Optimizer. Vous pouvez la retrouver en suivant [link=${environment.website_url}my-town/wishlist]ce lien[/link]`}[/aparte]`;

        this.clipboard.copy(text, $localize`La liste a bien été copiée au format forum`);
    }

    protected shareExcel(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const workbook: WorkBook = {
            Props: { Author: 'MyHordes Optimizer', Title: `MyHordes Optimizer - ${$localize`Liste de course`}` },
            Sheets: {},
            SheetNames: []
        };

        const data: WorkSheet = utils.json_to_sheet(this.buildExcelRows(info.wishlist_items), { cellStyles: true });
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
                    const new_wishlist: WishlistInfo = new WishlistInfo();
                    new_wishlist.update_info = info.update_info;
                    new_wishlist.wishlist_items = [];

                    const zone: { [key: string]: string | number }[] = utils.sheet_to_json(workbook.Sheets[$localize`Liste de courses`]);
                    const current_items: Item[] = this.items();

                    const items: WishlistItem[] = zone.reduce((acc: WishlistItem[], item: {
                        [key: string]: string | number
                    }, index: number): WishlistItem[] => {
                        const complete_item: Item | undefined = current_items.find(
                            (item_in_all: Item): boolean => item_in_all.id === item[this.excel_headers['id'].label]
                        );
                        if (complete_item) {
                            const new_item: WishlistItem = new WishlistItem();
                            new_item.depot = WishlistDepot.getDepotFromCountAndPriority(
                                <number>item[this.excel_headers['depot'].label],
                                1000 - index
                            );
                            new_item.zone_x_pa = <number>item[this.excel_headers['zone_x_pa'].label];
                            new_item.count = <number>item[this.excel_headers['count'].label];
                            new_item.priority = 1000 - index;
                            new_item.item = complete_item;
                            new_item.bank_count = complete_item.bank_count;
                            acc.push(new_item);
                        }
                        return acc;
                    }, []);

                    new_wishlist.wishlist_items = [...this.resetPriorities(items)];
                    if (new_wishlist.wishlist_items.length) {
                        this.wishlist_info.set(new_wishlist);
                        this.triggerSave();
                    }
                });
            });
    }

    /**
     * Lignes de l'export Excel, relues telles quelles par {@link importExcel}. La quantité est celle de la ligne
     * (`count`) : `item.wishlist_count` vient de la première ligne de l'objet dans la ville, quelle que soit sa zone.
     */
    protected buildExcelRows(items: WishlistItem[]): ExcelRow[] {
        return items.map((item: WishlistItem): ExcelRow => ({
            [this.excel_headers['id'].label]: item.item.id,
            [this.excel_headers['name'].label]: item.item.label[this.locale],
            [this.excel_headers['depot'].label]: item.depot.value.count,
            [this.excel_headers['zone_x_pa'].label]: item.zone_x_pa,
            [this.excel_headers['count'].label]: item.count
        }));
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

    /** Décoche toutes les lignes. */
    private clearSelection(): void {
        this.selected.set(new Set());
        this.selection_anchor = null;
    }

    private resetPriorities(array: WishlistItem[]): WishlistItem[] {
        let priority_factor: number = 999;
        array.forEach((item: WishlistItem): void => {
            item.priority = item.depot.value.count < -1 ? 1000 - priority_factor : priority_factor;
            priority_factor--;
        });
        return array.sort((item_a: WishlistItem, item_b: WishlistItem): number => item_b.priority - item_a.priority);
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

/** Identité d'une ligne : un objet ne figure qu'une fois par zone. */
function wishlistItemKey(row: WishlistItem): string {
    return `${row.item.id}_${row.zone_x_pa}`;
}

interface WishlistFilters {
    items: string;
    depot: WishlistDepot[];
}

type ExcelRow = Record<string, string | number>;
