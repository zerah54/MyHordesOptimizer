import { Item } from './../../_abstract_model/types/item.class';
import { ApiServices } from './../../_abstract_model/services/api.services';
import { Dictionary } from './../../_abstract_model/types/_types';
import { Component, OnInit } from '@angular/core';

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

        constructor(private api: ApiServices) {

        }

        ngOnInit(): void {
            this.api.getItems().subscribe((items: Item[]) => {
                this.items = items;
                if (this.items) {
                    this.items = this.items.sort((item_a: Item, item_b: Item) => item_a.category.localeCompare(item_b.category))
                    console.log('this.bank', this.items);
                }
            });
        }
}
