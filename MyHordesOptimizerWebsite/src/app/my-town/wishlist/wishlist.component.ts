import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, DOCUMENT, EventEmitter, inject, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
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
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/elements/confirm-dialog/confirm-dialog.component';
import { LastUpdateComponent } from '../../shared/elements/last-update/last-update.component';
import { HeaderWithStringFilterComponent } from '../../shared/elements/lists/header-with-string-filter/header-with-string-filter.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { ColumnIdPipe } from '../../shared/pipes/column-id.pipe';
import { CustomKeyValuePipe } from '../../shared/pipes/key-value.pipe';
import { ClipboardService } from '../../shared/services/clipboard.service';
import { IsItemDisplayedPipe } from './is-item-displayed.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [HeaderWithStringFilterComponent, LastUpdateComponent, SelectComponent];
const pipes: Imports = [ColumnIdPipe, CustomKeyValuePipe, IsItemDisplayedPipe];
const material_modules: Imports = [DragDropModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatOptionModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTabsModule, MatTooltipModule];

@Component({
    selector: 'mho-wishlist',
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class WishlistComponent implements OnInit {

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<WishlistItem>;
    @ViewChild(MatTabGroup) tabs!: MatTabGroup;
    @ViewChild('addItemSelect') add_item_select!: SelectComponent<Item>;

    /** La wishlist */
    public wishlist_info!: WishlistInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<WishlistItem> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        {id: 'sort', header: '', displayed: (): boolean => this.edition_mode},
        {id: 'name', header: $localize`Objet`, sticky: true},
        {id: 'heaver', header: ''},
        {id: 'depot', header: $localize`Dépôt`},
        {id: 'bank_count', header: $localize`Banque`},
        {id: 'bag_count', header: $localize`Sacs`},
        {id: 'count', header: $localize`Stock souhaité`},
        {id: 'needed', header: $localize`Quantité manquante`},
        {id: 'should_signal', header: $localize`Signaler`},
        {id: 'delete', header: '', displayed: (): boolean => this.edition_mode},
    ];

    public readonly basic_list_label: string = $localize`Toute la carte`;

    public selected_tab_key: string = '0';
    public selected_tab_index: number = 0;

    public edition_mode: boolean = JSON.parse(localStorage.getItem(WISHLIST_EDITION_MODE_KEY) || 'false');

    public items: Item[] = [];

    /** Les filtres de la liste de courses */
    public wishlist_filters: WishlistFilters = {
        items: '',
        depot: []
    };

    public drag_disabled: boolean = true;

    public wishlist_filters_change: EventEmitter<void> = new EventEmitter();

    /** La liste des en-têtes pour le fichier Excel */
    private readonly excel_headers: { [key: string]: { label: string, comment?: string } } = {
        id: {
            label: $localize`Identifiant`
        },
        name: {
            label: $localize`Nom de l'objet`
        },
        priority: {
            label: $localize`Priorité`,
            comment: `(3 : ${$localize`Haute`}, 2 : ${$localize`Moyenne`}, 1 : ${$localize`Basse`}, 0 : ${$localize`Non définie`}, -1 : ${$localize`Ne pas ramener`})`
        },
        count: {
            label: $localize`Quantité souhaitée`
        },
        depot: {
            label: $localize`Zone de dépôt`,
            comment: `(0 : ${$localize`Banque`}, 1 : ${$localize`Zone de rappatriement`}, 2 : ${$localize`Non définie`})`
        },
    };

    /** La liste des dépôts */
    public readonly depots: WishlistDepot[] = WishlistDepot.getAllValues();


    private readonly api: ApiService = inject(ApiService);
    private readonly wishlist_services: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    constructor(private clipboard: ClipboardService, private dialog: MatDialog, @Inject(DOCUMENT) private document: Document) {

    }

    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.wishlist_filters_change
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((): void => {
                this.datasource.filter = JSON.stringify(this.wishlist_filters);
            });

        this.datasource.filterPredicate = (data: WishlistItem, filter: string): boolean => this.customFilter(data, filter);

        this.getWishlist();
        this.api.getItems(true)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((items: Item[]): void => {
                this.items = items;
            });
    }

    /** Met à jour la liste de courses */
    public updateWishlist(): void {
        this.wishlist_services.updateWishlist(this.wishlist_info)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((wishlist_info: WishlistInfo): void => {
                this.wishlist_info = wishlist_info;
                this.wishlist_info.wishlist_items.forEach((zone: WishlistItem[]) => {
                    zone.forEach((item_in_zone: WishlistItem) => {
                        const item: Item = <Item>this.items.find((_item: Item): boolean => _item.id === item_in_zone.item.id);
                        item_in_zone.bank_count = item?.bank_count;
                        item_in_zone.item.bank_count = item?.bank_count;
                    });
                });
                this.datasource.data = [...<WishlistItem[]>wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || []];
            });
    }

    /** Retire une ligne de la liste */
    public remove(row: WishlistItem): void {
        const current_list: WishlistItem[] = [...<WishlistItem[]>this.wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || []];
        const index: number = current_list.findIndex((wishlist_item: WishlistItem): boolean => wishlist_item.item.id === row.item.id);
        current_list.splice(index, 1);
        setTimeout(() => {
            this.datasource.data = [...current_list];
            this.wishlist_info.wishlist_items.get(this.selected_tab_key)?.splice(index, 1);
        });
    }

    public addItemToWishlist(item: Item): void {
        if (item) {
            this.wishlist_services.addItemToWishlist(item, this.selected_tab_key)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe(() => {
                    this.add_item_select.value = undefined;
                    if (this.add_item_select.filter_input()) {
                        (<MatInput>this.add_item_select.filter_input()).value = '';
                    }
                    this.getWishlist();
                });
        }
    }

    public addZone(distance: number): void {
        if (!this.wishlist_info.wishlist_items.has(distance.toString())) {
            this.wishlist_info.wishlist_items.set(distance.toString(), []);
            this.wishlist_info.wishlist_items = new Map(this.wishlist_info.wishlist_items);
            this.selected_tab_index = this.tabs._allTabs.length - 1;
        }
    }

    public changeTab(event: MatTabChangeEvent): void {
        const keys: string[] = Array.from(this.wishlist_info.wishlist_items.keys());
        this.selected_tab_key = keys[event.index];
        this.datasource.data = [...<WishlistItem[]>this.wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || []];
    }

    public shareWishlistForum(): void {
        let text: string = `[big][b][i]${$localize`Liste de courses`}[/i][/b][/big]\n\n`;
        this.wishlist_info.wishlist_items.forEach((items: WishlistItem[], key: string) => {
            if (key === '0') {
                text += `[big][i]${this.basic_list_label}[/i][/big]`;
            } else {
                text += `[big][i]Z${key}[/i][/big]`;
            }
            text += '\n';

            items = items.sort((item_a: WishlistItem, item_b: WishlistItem) => item_b.priority - item_a.priority);

            const heavy: WishlistItem[] = items.filter((item: WishlistItem) => item.item.is_heaver && item.priority >= 0);
            const light: WishlistItem[] = items.filter((item: WishlistItem) => !item.item.is_heaver && item.priority >= 0);
            const do_not_bring_back: WishlistItem[] = items.filter((item: WishlistItem) => item.priority < 0);

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
        });

        text += `[b]${$localize`Dernière mise à jour` + ' : ' + this.wishlist_info.update_info.update_time.format('LLL') + ' ' + $localize`par` + ' ' + this.wishlist_info.update_info.username}[/b]\n`;
        text += `[aparte]${$localize`Cette liste a été générée à partir du site MyHordes Optimizer. Vous pouvez la retrouver en suivant [link=${environment.website_url}my-town/wishlist]ce lien[/link]`}[/aparte]`;

        this.clipboard.copy(text, $localize`La liste a bien été copiée au format forum`);
    }

    public shareExcel(): void {

        const workbook: WorkBook = {
            Props: {
                Author: 'MyHordes Optimizer',
                Title: `MyHordes Optimizer - ${$localize`Liste de course`}`
            },
            Sheets: {},
            SheetNames: []
        };

        for (const wishlist_zone_key of Array.from(this.wishlist_info.wishlist_items)) {
            const zone_items_key: string = wishlist_zone_key[0];
            const zone_items: WishlistItem[] = wishlist_zone_key[1];
            const simplify_item: { [key: string]: string | number }[] = zone_items.map((item: WishlistItem): { [key: string]: string | number } => {
                const final_item: { [key: string]: string | number } = {};
                final_item[this.excel_headers['id'].label] = item.item.id;
                final_item[this.excel_headers['name'].label] = item.item.label[this.locale];
                final_item[this.excel_headers['priority'].label] = item.priority;
                final_item[this.excel_headers['count'].label] = item.item.wishlist_count;
                final_item[this.excel_headers['depot'].label] = item.depot.value.count;
                return final_item;
            });
            const data: WorkSheet = utils.json_to_sheet(simplify_item, {cellStyles: true});
            workbook.SheetNames.push(zone_items_key);
            workbook.Sheets[zone_items_key] = data;
        }

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

    public importExcel(element: HTMLInputElement): void {
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
                if (confirm) {

                    if (!element || !element.files || element.files.length === 0) {
                        return;
                    }

                    const file: File = element.files[0];

                    file.arrayBuffer().then((data: ArrayBuffer): void => {
                        const workbook: WorkBook = read(data);
                        const new_wishlist: WishlistInfo = new WishlistInfo();
                        new_wishlist.update_info = this.wishlist_info.update_info;
                        new_wishlist.wishlist_items = new Map();
                        for (const sheet_key in workbook.Sheets) {
                            if (typeof +sheet_key === 'number') {
                                const zone: { [key: string]: string | number }[] = utils.sheet_to_json(workbook.Sheets[sheet_key]);
                                const items: WishlistItem[] = [];
                                zone.forEach((item: { [key: string]: string | number }): void => {
                                    const new_item: WishlistItem = new WishlistItem();
                                    const complete_item: Item | undefined = this.items
                                        .find((item_in_all: Item): boolean => item_in_all.id === item[this.excel_headers['id'].label]);
                                    if (complete_item) {
                                        new_item.zone_x_pa = +sheet_key;
                                        new_item.depot = WishlistDepot.getDepotFromCountAndPriority(<number>item[this.excel_headers['depot'].label], <number>item[this.excel_headers['priority'].label]);
                                        new_item.count = <number>item[this.excel_headers['count'].label];
                                        new_item.item = complete_item;
                                        new_item.bank_count = complete_item.bank_count;
                                    }
                                    items.push(new_item);
                                });
                                new_wishlist.wishlist_items.set(sheet_key, [...this.resetPriorities(items)]);

                            }
                        }

                        if (new_wishlist.wishlist_items) {
                            this.wishlist_info = new_wishlist;
                            this.updateWishlist();
                        }

                    });
                }
            });
    }

    public sortWishlist(event: CdkDragDrop<MatTableDataSource<WishlistItem>>): void {
        this.drag_disabled = true;
        const current_wishlist_items: WishlistItem[] = this.wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || [];
        const previous_index_in_real_array: number = current_wishlist_items.findIndex((item: WishlistItem) => item.item.id === event.item.data.item.id);
        moveItemInArray(current_wishlist_items, previous_index_in_real_array, event.currentIndex);
        let new_pos: number;
        if (current_wishlist_items[event.currentIndex - 1]) {
            new_pos = event.currentIndex - 1;
        } else if (current_wishlist_items[event.currentIndex + 1]) {
            new_pos = event.currentIndex + 1;
        } else {
            new_pos = event.currentIndex;
        }

        current_wishlist_items[event.currentIndex].priority = current_wishlist_items[new_pos].priority;
        current_wishlist_items[event.currentIndex].depot = WishlistDepot.getDepotFromCountAndPriority(current_wishlist_items[new_pos].depot.value.count, current_wishlist_items[new_pos].priority);


        this.datasource.data = [...this.resetPriorities(current_wishlist_items)];
    }

    public resetPriorities(array: WishlistItem[]): WishlistItem[] {

        let priority_factor: number = 999;
        array.forEach((item: WishlistItem) => {
            item.priority = item.depot.value.count < -1 ? 1000 - priority_factor : priority_factor;
            priority_factor--;
        });
        array = array.sort((item_a: WishlistItem, item_b: WishlistItem) => item_b.priority - item_a.priority);
        return array;
    }

    public changeDepot(): void {
        this.datasource.data = [...this.resetPriorities(this.datasource.data)];
    }

    /**
     * Enregistre le mode d'affichage de la liste de courses
     */
    public changeEditionMode(): void {
        localStorage.setItem(WISHLIST_EDITION_MODE_KEY, JSON.stringify(this.edition_mode));
    }

    public compareWith(option: WishlistDepot, selected: WishlistDepot): boolean {
        return option.value.count === selected.value.count;
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: WishlistItem, filter: string): boolean {
        const filter_object: WishlistFilters = JSON.parse(filter.toLowerCase());
        if (!filter_object || ((!filter_object.items || filter_object.items === '') && !filter_object.depot)) return true;
        if (data.item.label[this.locale].toLocaleLowerCase().indexOf(filter_object.items.toLocaleLowerCase()) > -1) return true;
        return false;
    }

    private getWishlist(): void {
        this.wishlist_services.getWishlist()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((wishlist_info: WishlistInfo) => {
                this.wishlist_info = wishlist_info;
                this.datasource.data = [...<WishlistItem[]>wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || []];
            });
    }
}

interface WishlistFilters {
    items: string;
    depot: WishlistDepot[];
}
