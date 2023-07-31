import { Component, ElementRef, EventEmitter, HostBinding, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import * as moment from 'moment';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { ApiServices } from '../../_abstract_model/services/api.services';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { WishlistServices } from '../../_abstract_model/services/wishlist.service';
import { ClipboardService } from '../../shared/services/clipboard.service';
import { environment } from '../../../environments/environment';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { read, utils, WorkBook, WorkSheet, write } from 'xlsx';
import { ConfirmDialogComponent } from '../../shared/elements/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DOCUMENT } from '@angular/common';


@Component({
    selector: 'mho-wishlist',
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<WishlistItem>;
    @ViewChild(MatTabGroup) tabs!: MatTabGroup;
    @ViewChild('filterInput') filterInput!: ElementRef;
    @ViewChild('addItemSelect') add_item_select!: SelectComponent<Item>;

    /** La wishlist */
    public wishlist_info!: WishlistInfo;
    /** La datasource pour le tableau */
    public datasource: TableVirtualScrollDataSource<WishlistItem> = new TableVirtualScrollDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des colonnes */
    public readonly columns: WishlistColumns[] = [
        {id: 'sort', header: ''},
        {id: 'name', header: $localize`Objet`},
        {id: 'priority', header: $localize`Priorité`},
        {id: 'depot', header: $localize`Dépôt`},
        {id: 'bank_count', header: $localize`Banque`},
        {id: 'bag_count', header: $localize`Sacs`},
        {id: 'count', header: $localize`Stock souhaité`},
        {id: 'needed', header: $localize`Quantité manquante`},
        {id: 'delete', header: ''},
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: WishlistColumns) => column.id);
    public readonly basic_list_label: string = $localize`Toute la carte`;

    public selected_tab_key: string = '0';
    public selected_tab_index: number = 0;

    public items: Item[] = [];
    /** Les filtres de la liste de courses */
    public wishlist_filters: WishlistFilters = {
        items: '',
        priority: [],
        depot: []
    };

    public wishlist_filters_change: EventEmitter<void> = new EventEmitter();

    private readonly excel_headers: { [key: string]: { label: string, comment?: string } } = {
        id: {label: $localize`Identifiant`},
        name: {label: $localize`Nom de l'objet`},
        priority: {
            label: $localize`Priorité`,
            comment: `(3 : ${$localize`Haute`}, 2 : ${$localize`Moyenne`}, 1 : ${$localize`Basse`}, 0 : ${$localize`Non définie`}, -1 : ${$localize`Ne pas ramener`})`
        },
        count: {label: $localize`Quantité souhaitée`},
        depot: {label: $localize`Zone de dépôt`, comment: `(0 : ${$localize`Banque`}, 1 : ${$localize`Zone de rappatriement`}, 2 : ${$localize`Non définie`})`},
    };


    /** La liste des priorités */
    public readonly priorities: PriorityOrDepot[] = [
        {count: -1, label: $localize`Ne pas ramener`},
        {count: 0, label: $localize`Non définie`},
        {count: 1, label: $localize`Basse`},
        {count: 2, label: $localize`Moyenne`},
        {count: 3, label: $localize`Haute`}
    ];

    /** La liste des dépôts */
    public readonly depots: PriorityOrDepot[] = [
        {count: -1, label: $localize`Non définie`},
        {count: 0, label: $localize`Banque`},
        {count: 1, label: $localize`Zone de rapatriement`},
    ];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices, private wishlist_sercices: WishlistServices, private clipboard: ClipboardService, private dialog: MatDialog,
                @Inject(DOCUMENT) private document: Document) {

    }

    public ngOnInit(): void {
        this.datasource = new TableVirtualScrollDataSource();
        this.datasource.sort = this.sort;

        this.wishlist_filters_change
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((): void => {
                this.datasource.filter = JSON.stringify(this.wishlist_filters);
            });

        this.datasource.filterPredicate = (data: WishlistItem, filter: string): boolean => this.customFilter(data, filter);

        this.getWishlist();
        this.api.getItems(true)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((items: Item[]): void => {
                this.items = items;
            });
    }

    /** Met à jour la liste de courses */
    public updateWishlist(): void {
        this.wishlist_sercices.updateWishlist(this.wishlist_info)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((wishlist_info: WishlistInfo): void => {
                this.wishlist_info = wishlist_info;
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
            this.wishlist_sercices.addItemToWishlist(item, this.selected_tab_key)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe(() => {
                    item.wishlist_count = 1;
                    this.add_item_select.value = undefined;
                    this.getWishlist();
                });
        }
    }

    public trackByColumnId(_index: number, column: WishlistColumns): string {
        return column.id;
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
                    text += `:middot:${item.item.label[this.locale]}` + (item.count !== null && item.count !== undefined && item.count < 100 ? ` (x${item.count})` : '') + (item.depot === 1 ? `[i]${$localize`Zone de rappatriement`}[/i]` : '') + '\n';
                });
                text += '[/collapse]\n';
            }
            if (light.length > 0) {
                text += `\n[collapse=${$localize`Non-Encombrants`}]\n`;
                light.forEach((item: WishlistItem): void => {
                    text += `:middot:${item.item.label[this.locale]}` + (item.count !== null && item.count !== undefined && item.count < 100 ? ` (x${item.count})` : '') + (item.depot === 1 ? `[i]${$localize`Zone de rappatriement`}[/i]` : '') + '\n';
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
                final_item[this.excel_headers['priority'].label] = item.priority_main;
                final_item[this.excel_headers['count'].label] = item.item.wishlist_count;
                final_item[this.excel_headers['depot'].label] = item.depot;
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

    public importExcel(event: Event): void {
        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Voulez-vous écraser la liste actuelle ? Elle sera perdue.`
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((confirm: boolean): void => {
                if (confirm) {

                    const target: HTMLInputElement = <HTMLInputElement>event.target;
                    if (!target || !target.files || target.files.length === 0) {
                        return;
                    }

                    const file: File = target.files[0];

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
                                        new_item.depot = <number>item[this.excel_headers['depot'].label];
                                        new_item.count = <number>item[this.excel_headers['count'].label];
                                        new_item.priority_main = <number>item[this.excel_headers['priority'].label];
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

    public sortWishlist(event: CdkDragDrop<TableVirtualScrollDataSource<WishlistItem>>): void {
        const current_wishlist_items: WishlistItem[] = this.wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || [];
        const previous_index_in_real_array: number = current_wishlist_items.findIndex((item: WishlistItem) => item.item.id === event.item.data.item.id);
        let current_index_in_real_array: number;
        if ((<{ [key: string]: any }>this.datasource.dataOfRange$)['_buffer'][0][event.currentIndex - 1]) {
            current_index_in_real_array = current_wishlist_items
                .findIndex((item: WishlistItem) => item.item.id === (<{
                    [key: string]: any
                }>this.datasource.dataOfRange$)['_buffer'][0][event.currentIndex - 1].item.id) + 1;
        } else if ((<{ [key: string]: any }>this.datasource.dataOfRange$)['_buffer'][0][event.currentIndex + 1]) {
            current_index_in_real_array = current_wishlist_items
                .findIndex((item: WishlistItem) => item.item.id === (<{
                    [key: string]: any
                }>this.datasource.dataOfRange$)['_buffer'][0][event.currentIndex + 1].item.id) - 1;
        } else {
            current_index_in_real_array = 0;
        }
        moveItemInArray(current_wishlist_items, previous_index_in_real_array, current_index_in_real_array);
        if (current_wishlist_items[current_index_in_real_array - 1]) {
            current_wishlist_items[current_index_in_real_array].priority_main = current_wishlist_items[current_index_in_real_array - 1].priority_main;
            current_wishlist_items[current_index_in_real_array].priority = current_wishlist_items[current_index_in_real_array - 1].priority;
        } else if (current_wishlist_items[current_index_in_real_array + 1]) {
            current_wishlist_items[current_index_in_real_array].priority_main = current_wishlist_items[current_index_in_real_array + 1].priority_main;
            current_wishlist_items[current_index_in_real_array].priority = current_wishlist_items[current_index_in_real_array + 1].priority;
        }

        this.datasource.data = [...this.resetPriorities(current_wishlist_items)];
    }

    public resetPriorities(array: WishlistItem[]): WishlistItem[] {

        let priority_factor: number = 999;
        array.forEach((item: WishlistItem) => {
            item.priority = parseInt(item.priority_main.toString() + (item.priority_main > 0 ? priority_factor.toString() : (1000 - priority_factor).toString()));
            priority_factor--;
        });
        array = array.sort((item_a: WishlistItem, item_b: WishlistItem) => item_b.priority - item_a.priority);
        return array;
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: WishlistItem, filter: string): boolean {
        const filter_object: WishlistFilters = JSON.parse(filter.toLowerCase());
        if (!filter_object || ((!filter_object.items || filter_object.items === '') && !filter_object.depot && !filter_object.priority)) return true;
        if (data.item.label[this.locale].toLocaleLowerCase().indexOf(filter_object.items.toLocaleLowerCase()) > -1) return true;
        return false;
    }

    private getWishlist(): void {
        this.wishlist_sercices.getWishlist()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((wishlist_info: WishlistInfo) => {
                this.wishlist_info = wishlist_info;
                this.datasource.data = [...<WishlistItem[]>wishlist_info.wishlist_items.get(this.selected_tab_key) || this.wishlist_info.wishlist_items.get('0') || []];
            });
    }
}

interface PriorityOrDepot {
    count: number;
    label: string;
}

interface WishlistColumns {
    header: string;
    id: string;
}

interface WishlistFilters {
    items: string;
    priority: PriorityOrDepot[];
    depot: PriorityOrDepot[];
}
