import { Item } from './../../_abstract_model/types/item.class';
import { ApiServices } from './../../_abstract_model/services/api.services';
import { Dictionary } from './../../_abstract_model/types/_types';
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
    selector: 'mho-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {

    /** La liste des objets du jeu */
    public items!: Item[];
    /** Les objets triés par catégorie */
    public items_by_category!: Dictionary<unknown>;

    public displayed_items!: Item[];

    private locale: string = moment.locale();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getItems().subscribe((items: Item[]) => {
            this.items = items;
            if (this.items) {
                this.items = this.items.sort((item_a: Item, item_b: Item) => item_a.category.localeCompare(item_b.category));
                this.displayed_items = [...this.items];
            }
        });
    }

    public applyFilter(value: string): void {
        if (value !== null && value !== undefined && value !== '') {
            this.displayed_items = [...this.items.filter((item: Item) => item.label[this.locale].toLowerCase().indexOf(value.toLowerCase()) > -1)]
        } else {
            this.displayed_items = [...this.items]
        }
    }
}
