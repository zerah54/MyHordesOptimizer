import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from './../../_abstract_model/const';
import { ApiServices } from './../../_abstract_model/services/api.services';
import { WishlistInfo } from './../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from './../../_abstract_model/types/wishlist-item.class';

@Component({
    selector: 'mho-wishlist',
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent {
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<WishlistItem>;

    /** La wishlist */
    public wishlist_info!: WishlistInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<WishlistItem> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();
    /** La liste des colonnes */
    public readonly columns: WishlistColumns[] = [
        { id: 'name', header: `Nom de l'objet` },
        { id: 'priority', header: `Priorité` },
        { id: 'bank_count', header: `Stock en banque` },
        { id: 'count', header: `Stock souhaité` },
        { id: 'needed', header: `Quantité manquante` },
        { id: 'delete', header: `` },
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = ['name', 'priority', 'bank_count', 'count', 'needed', 'delete'];

    /** La liste des priorités */
    public readonly priorities: Priorities[] = [
        { count: 0, label: `Non définie` },
        { count: 10, label: `Basse` },
        { count: 20, label: `Moyenne` },
        { count: 30, label: `Haute` }
    ]

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getWishlist().subscribe((wishlist_info: WishlistInfo) => {
            this.wishlist_info = wishlist_info;
            this.datasource = new MatTableDataSource(this.wishlist_info.wishlist_items);
            this.datasource.sort = this.sort;
            this.datasource.filterPredicate = (data: WishlistItem, filter: string) => this.customFilter(data, filter);
        });
    }

    /** Met à jour la liste de courses */
    public updateWishlist(): void {
        this.api.updateWishlist(this.wishlist_info).subscribe((wishlist_info: WishlistInfo) => {
            this.wishlist_info = wishlist_info;
            this.datasource.data = wishlist_info.wishlist_items;
        })
    }

    /** Filtre la liste à afficher */
    public applyFilter(event: Event): void {
        const value: string = (event.target as HTMLInputElement).value;
        this.datasource.filter = value.trim().toLowerCase();

    }

    /** Retire une ligne de la liste */
    public remove(row: WishlistItem) {
        let index = this.wishlist_info.wishlist_items.findIndex((wishlist_item: WishlistItem) => wishlist_item.item.xml_id === row.item.xml_id);
        this.wishlist_info.wishlist_items.splice(index, 1);
        this.table.renderRows();
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: WishlistItem, filter: string): boolean {
        if (data.item.label[this.locale].toLowerCase().indexOf(filter) > -1) return true;
        return false;
    }
}

interface Priorities {
    count: number;
    label: string;
}

interface WishlistColumns {
    header: string;
    id: string;
}
