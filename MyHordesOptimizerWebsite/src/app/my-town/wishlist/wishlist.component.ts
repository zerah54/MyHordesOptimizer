import { Component, ElementRef, EventEmitter, HostBinding, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import * as moment from 'moment';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { SelectComponent } from 'src/app/shared/elements/select/select.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';
import { WishlistServices } from 'src/app/_abstract_model/services/wishlist.service';
import { environment } from 'src/environments/environment';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { ApiServices } from '../../_abstract_model/services/api.services';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';

@Component({
    selector: 'mho-wishlist',
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent {
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
        { id: 'name', header: $localize`Objet` },
        { id: 'priority', header: $localize`Priorité` },
        { id: 'depot', header: $localize`Dépôt` },
        { id: 'bank_count', header: $localize`Banque` },
        { id: 'bag_count', header: $localize`Sacs` },
        { id: 'count', header: $localize`Stock souhaité` },
        { id: 'needed', header: $localize`Quantité manquante` },
        { id: 'delete', header: `` },
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

    /** La liste des priorités */
    public readonly priorities: PriorityOrDepot[] = [
        { count: -1000, label: $localize`Ne pas ramener` },
        { count: 0, label: $localize`Non définie` },
        { count: 1000, label: $localize`Basse` },
        { count: 2000, label: $localize`Moyenne` },
        { count: 3000, label: $localize`Haute` }
    ]

    /** La liste des dépôts */
    public readonly depots: PriorityOrDepot[] = [
        { count: -1, label: $localize`Non définie` },
        { count: 0, label: $localize`Banque` },
        { count: 1, label: $localize`Zone de rapatriement` },
    ]

    constructor(private api: ApiServices, private wishlist_sercices: WishlistServices, private clipboard: ClipboardService) {

    }

    ngOnInit(): void {
        this.datasource = new TableVirtualScrollDataSource();
        this.datasource.sort = this.sort;

        this.wishlist_filters_change.subscribe(() => {
            this.datasource.filter = JSON.stringify(this.wishlist_filters);
        });

        this.datasource.filterPredicate = (data: WishlistItem, filter: string) => this.customFilter(data, filter);

        this.getWishlist();
        this.api.getItems(true).subscribe((items: Item[]) => {
            this.items = items;
        });
    }

    /** Met à jour la liste de courses */
    public updateWishlist(): void {
        this.wishlist_sercices.updateWishlist(this.wishlist_info).subscribe((wishlist_info: WishlistInfo) => {
            this.wishlist_info = wishlist_info;
            this.datasource.data = [...<WishlistItem[]>wishlist_info.wishlist_items.get(this.selected_tab_key)];
        })
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    /** Retire une ligne de la liste */
    public remove(row: WishlistItem) {
        let current_list: WishlistItem[] = [...<WishlistItem[]>this.wishlist_info.wishlist_items.get(this.selected_tab_key)];
        let index: number = current_list.findIndex((wishlist_item: WishlistItem) => wishlist_item.item.id === row.item.id);
        current_list.splice(index, 1);
        setTimeout(() => {
            this.datasource.data = [...current_list];
            this.wishlist_info.wishlist_items.get(this.selected_tab_key)?.splice(index, 1);
        });
    }

    public addItemToWishlist(item: Item) {
        if (item) {
            this.wishlist_sercices.addItemToWishlist(item, this.selected_tab_key).subscribe(() => {
                item.wishlist_count = 1;
                this.add_item_select.value = undefined;
                this.getWishlist();
            })
        }
    }

    public trackByColumnId(index: number, column: WishlistColumns): string {
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
        let keys: string[] = Array.from(this.wishlist_info.wishlist_items.keys());
        this.selected_tab_key = keys[event.index];
        setTimeout(() => {
            this.datasource.data = [...<WishlistItem[]>this.wishlist_info.wishlist_items.get(this.selected_tab_key)];
        });
    }

    public shareWishlist() {
        let text: string = `[big][b][i]${$localize`Liste de courses`}[/i][/b][/big]\n\n`;
        this.wishlist_info.wishlist_items.forEach((items: WishlistItem[], key: string) => {
            if (key === '0') {
                text += `[big][i]${this.basic_list_label}[/i][/big]`;
            } else {
                text += `[big][i]Z${key}[/i][/big]`
            }
            text += `\n`;

            items = items.sort((item_a: WishlistItem, item_b: WishlistItem) => item_b.priority - item_a.priority)

            let heavy: WishlistItem[] = items.filter((item: WishlistItem) => item.item.is_heaver && item.priority >= 0);
            let light: WishlistItem[] = items.filter((item: WishlistItem) => !item.item.is_heaver && item.priority >= 0);
            let do_not_bring_back: WishlistItem[] = items.filter((item: WishlistItem) => item.priority < 0);

            if (heavy.length > 0) {
                text += `\n[b][i]${$localize`Encombrants`}[/i][/b]\n`;
                heavy.forEach((item: WishlistItem) => {
                    text += `:middot:${item.item.label[this.locale]}` + (item.count !== null && item.count !== undefined && item.count < 1000 ? ` (x${item.count})` : ``) + `\n`;
                })
            }
            if (light.length > 0) {
                text += `\n[b][i]${$localize`Non-Encombrants`}[/i][/b]\n`;
                light.forEach((item: WishlistItem) => {
                    text += `:middot:${item.item.label[this.locale]}` + (item.count !== null && item.count !== undefined && item.count < 1000 ? ` (x${item.count})` : ``) + `\n`;
                })
            }
            if (do_not_bring_back.length > 0) {
                text += `\n[collapse=${$localize`Ne pas rapporter`}]\n`;
                do_not_bring_back.forEach((item: WishlistItem) => {
                    text += `:middot:${item.item.label[this.locale]}\n`;
                })
                text += `[/collapse]`;
            }
            text += `\n{hr}\n\n`;
        })

        text += `[b]${$localize`Dernière mise à jour` + ` : ` + this.wishlist_info.update_info.update_time.format('LLL') + ' ' + $localize`par` + ' ' + this.wishlist_info.update_info.username}[/b]\n`
        text += `[aparte]${$localize`Cette liste a été générée à partir du site MyHordes Optimizer. Vous pouvez la retrouver en suivant [link=${environment.website_url}my-town/wishlist]ce lien[/link]`}[/aparte]`

        this.clipboard.copy(text, $localize`La liste a bien été copiée au format forum`);
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: WishlistItem, filter: string): boolean {
        let filter_object: WishlistFilters = JSON.parse(filter.toLowerCase());
        if (!filter_object || ((!filter_object.items || filter_object.items === '') && !filter_object.depot && !filter_object.priority)) return true;
        if (data.item.label[this.locale].toLocaleLowerCase().indexOf(filter_object.items.toLocaleLowerCase()) > -1) return true;
        return false;
    }

    private getWishlist(): void {
        this.wishlist_sercices.getWishlist().subscribe((wishlist_info: WishlistInfo) => {
            this.wishlist_info = wishlist_info;
            this.datasource.data = [...<WishlistItem[]>wishlist_info.wishlist_items.get(this.selected_tab_key)];
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
