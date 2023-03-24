import { Component, HostBinding, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { Action } from 'src/app/_abstract_model/enum/action.enum';
import { Property } from 'src/app/_abstract_model/enum/property.enum';
import { ApiServices } from '../../_abstract_model/services/api.services';
import { Item } from '../../_abstract_model/types/item.class';

@Component({
    selector: 'mho-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La liste des objets du jeu */
    public items!: Item[];

    public displayed_items!: Item[];

    public readonly locale: string = moment.locale();

    /** Le champ de filtre sur les objets */
    public filter_value: string = '';
    /** Le champ de filtres sur les propriétés */
    public select_value: (Property | Action)[] = [];

    /** La liste des filtres */
    public options: (Property | Action)[] = [...<any>Property.getAllValues(), ...<any>Action.getAllValues()];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getItems(true)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((items: Item[]) => {
                this.items = items;
                if (this.items) {
                    this.items = this.items.sort((item_a: Item, item_b: Item) => {
                        if (item_a.category.ordering < item_b.category.ordering) {
                            return -1;
                        } else if (item_a.category.ordering === item_b.category.ordering) {
                            return 0;
                        } else {
                            return 1;
                        }
                    });
                    this.displayed_items = [...this.items];
                }
            });
    }

    public applyFilters(): void {
        if (this.filter_value !== null && this.filter_value !== undefined && this.filter_value !== '') {
            this.displayed_items = [...this.items.filter((item: Item) => item.label[this.locale].toLowerCase().indexOf(this.filter_value.toLowerCase()) > -1)];
        } else {
            this.displayed_items = [...this.items];
        }

        if (this.select_value && this.select_value.length > 0) {
            this.displayed_items = this.displayed_items.filter((item: Item) => {
                const item_actions_and_properties: (Action | Property)[] = [
                    ...item.actions.filter((action: Action) => action),
                    ...item.properties.filter((property: Property) => property)
                ];
                const item_has_action_or_property: boolean = item_actions_and_properties.some((action_or_property: Action | Property) => {
                    return this.select_value.some((selected: Action | Property) => selected.key === action_or_property.key);
                });
                const item_has_key: boolean = this.select_value.some((filter: Property | Action) => item[filter.key]);
                return item_has_action_or_property || item_has_key;
            });
        }
    }
}
