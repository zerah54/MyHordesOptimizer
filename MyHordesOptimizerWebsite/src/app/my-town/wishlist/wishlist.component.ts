import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
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
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { read, utils, WorkBook, WorkSheet, write } from 'xlsx';
import { environment } from '../../../environments/environment';
import { HORDES_IMG_REPO, WISHLIST_EDITION_MODE_KEY } from '../../_abstract_model/const';
import { WishlistDepot } from '../../_abstract_model/enum/wishlist-depot.enum';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { ColumnIdPipe } from '../../_core/pipes/column-id.pipe';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { DeferredCellComponent } from '../../_shared/deferred-cell/deferred-cell.component';
import { LastUpdateComponent } from '../../_shared/last-update/last-update.component';
import { HeaderWithStringFilterComponent } from '../../_shared/lists/header-with-string-filter/header-with-string-filter.component';
import { SelectComponent } from '../../_shared/select/select.component';
import { IsItemDisplayedPipe } from './is-item-displayed.pipe';
import { ItemAlreadyInListPipe } from './item-already-in-list.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [DeferredCellComponent, HeaderWithStringFilterComponent, LastUpdateComponent, SelectComponent];
const pipes: Imports = [ColumnIdPipe, IsItemDisplayedPipe];
const material_modules: Imports = [DragDropModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatOptionModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTooltipModule];

@Component({
    selector: 'mho-wishlist',
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes, ItemAlreadyInListPipe]
})
export class WishlistComponent implements OnInit {
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly document: Document = inject<Document>(DOCUMENT);
    private readonly api: ApiService = inject(ApiService);
    private readonly wishlist_services: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly sort: Signal<MatSort | undefined> = viewChild(MatSort);
    protected readonly table: Signal<MatTable<WishlistItem> | undefined> = viewChild(MatTable);
    protected readonly add_item_select: Signal<SelectComponent<Item> | undefined> = viewChild<SelectComponent<Item>>('addItemSelect');

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();
    protected readonly columns: StandardColumn[] = [
        {id: 'sort', header: '', displayed: (): boolean => this.edition_mode()},
        {id: 'name', header: $localize`Objet`, sticky: true},
        {id: 'heaver', header: ''},
        {id: 'depot', header: $localize`Dépôt`},
        {id: 'zone_x_pa', header: $localize`Zone en PA`},
        {id: 'bank_count', header: $localize`Banque`},
        {id: 'bag_count', header: $localize`Sacs`},
        {id: 'count', header: $localize`Stock souhaité`},
        {id: 'needed', header: $localize`Quantité manquante`},
        {id: 'should_signal', header: $localize`Signaler`},
        {id: 'delete', header: '', displayed: (): boolean => this.edition_mode()},
    ];
    protected readonly depots: WishlistDepot[] = WishlistDepot.getAllValues();

    protected wishlist_info: WritableSignal<WishlistInfo | null> = signal(null);
    protected items: WritableSignal<Item[]> = signal([]);
    protected edition_mode: WritableSignal<boolean> = signal(JSON.parse(localStorage.getItem(WISHLIST_EDITION_MODE_KEY) || 'false'));
    protected drag_disabled: WritableSignal<boolean> = signal(true);
    protected wishlist_filters: WritableSignal<WishlistFilters> = signal({items: '', depot: []});
    protected current_zone_xp_pa_add_item: WritableSignal<number> = signal(0);

    protected datasource: MatTableDataSource<WishlistItem> = new MatTableDataSource();

    protected wishlist_filters_change: EventEmitter<void> = new EventEmitter();

    private readonly auto_save$: Subject<WishlistInfo> = new Subject();

    private readonly excel_headers: { [key: string]: { label: string, comment?: string } } = {
        id: {label: $localize`Identifiant`},
        name: {label: $localize`Nom de l'objet`},
        depot: {
            label: $localize`Zone de dépôt`,
            comment: `(0 : ${$localize`Banque`}, 1 : ${$localize`Zone de rappatriement`}, 2 : ${$localize`Non définie`})`
        },
        zone_x_pa: {
            label: $localize`Zone`,
            comment: `(0 : ${$localize`Banque`}, 1 : ${$localize`Zone de rappatriement`}, 2 : ${$localize`Non définie`})`
        },
        count: {label: $localize`Quantité souhaitée`},
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

    protected changeZoneXPa(item: WishlistItem, new_zone: number): void {
        item.zone_x_pa = new_zone;
        this.triggerSave();
    }

    /** Déclenche l'auto-save */
    protected triggerSave(): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const has_duplicates: boolean = info.wishlist_items.some(
            (item: WishlistItem, index: number): boolean => info.wishlist_items.some(
                (other: WishlistItem, other_index: number): boolean =>
                    index !== other_index && item.item.id === other.item.id && item.zone_x_pa === other.zone_x_pa
            )
        );

        if (has_duplicates) return;

        this.auto_save$.next(info);
    }

    /** Retire une ligne de la liste */
    protected remove(row: WishlistItem): void {
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const updated_items: WishlistItem[] = [...info.wishlist_items];
        const index: number = updated_items.findIndex((wishlist_item: WishlistItem): boolean => wishlist_item.item.id === row.item.id);
        if (index === -1) return;

        updated_items.splice(index, 1);
        this.wishlist_info.update((current: WishlistInfo | null): WishlistInfo => {
            current!.wishlist_items = updated_items;
            return new WishlistInfo(current?.modelToDto());
        });
        this.triggerSave();
    }

    protected addItemToWishlist(item: Item): void {
        if (!item) return;

        this.wishlist_services.addItemToWishlist(item, this.current_zone_xp_pa_add_item())
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((): void => {
                if (this.add_item_select()) {
                    const add_item_select: SelectComponent<Item> = this.add_item_select() as SelectComponent<Item>;
                    add_item_select.value = undefined;
                    if (add_item_select.filter_input()) {
                        (<MatInput>add_item_select.filter_input()).value = '';
                    }
                    this.getWishlist();
                }
            });
    }

    protected sortWishlist(event: CdkDragDrop<MatTableDataSource<WishlistItem>>): void {
        this.drag_disabled.set(true);
        const info: WishlistInfo | null = this.wishlist_info();
        if (!info) return;

        const current_wishlist_items: WishlistItem[] = [...info.wishlist_items];
        const previous_index_in_real_array: number = current_wishlist_items.findIndex(
            (item: WishlistItem): boolean => item.item.id === event.item.data.item.id
                && item.zone_x_pa === event.item.data.zone_x_pa
        );
        moveItemInArray(current_wishlist_items, previous_index_in_real_array, event.currentIndex);

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
            Props: {Author: 'MyHordes Optimizer', Title: `MyHordes Optimizer - ${$localize`Liste de course`}`},
            Sheets: {},
            SheetNames: []
        };

        const simplify_item: { [key: string]: string | number }[] = info.wishlist_items.map((item: WishlistItem): { [key: string]: string | number } => {
            const final_item: { [key: string]: string | number } = {};
            final_item[this.excel_headers['id'].label] = item.item.id;
            final_item[this.excel_headers['name'].label] = item.item.label[this.locale];
            final_item[this.excel_headers['depot'].label] = item.depot.value.count;
            final_item[this.excel_headers['zone_x_pa'].label] = item.zone_x_pa;
            final_item[this.excel_headers['count'].label] = item.item.wishlist_count;
            return final_item;
        });

        const data: WorkSheet = utils.json_to_sheet(simplify_item, {cellStyles: true});
        workbook.SheetNames.push($localize`Liste de courses`);
        workbook.Sheets[$localize`Liste de courses`] = data;

        const u8: Uint8Array = write(workbook, {type: 'buffer', bookType: 'xlsx'});
        const blob: Blob = new Blob([u8], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
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

interface WishlistFilters {
    items: string;
    depot: WishlistDepot[];
}
