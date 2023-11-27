import { Component, HostBinding, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Item } from '../../_abstract_model/types/item.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { normalizeString } from '../../shared/utilities/string.utils';
import { ItemsGroupByCategory } from '../../shared/pipes/items-group-by-category.pipe';
import { ItemComponent } from '../../shared/elements/item/item.component';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FilterFieldComponent } from '../../shared/elements/filter-field/filter-field.component';
import { NgIf, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss'],
    standalone: true,
    imports: [MatCardModule, NgIf, FilterFieldComponent, MatFormFieldModule, SelectComponent, FormsModule, NgFor, ItemComponent, ItemsGroupByCategory]
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
    public options: (Property | Action)[] = [...<Property[]>Property.getAllValues(), ...<Action[]>Action.getAllValues()];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiService) {

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
            this.displayed_items = [...this.items.filter((item: Item) => normalizeString(item.label[this.locale]).indexOf(normalizeString(this.filter_value)) > -1)];
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
                const item_has_key: boolean = this.select_value.some((filter: Property | Action) => (<{ [key: string]: unknown }><unknown>item)[filter.key]);
                return item_has_action_or_property || item_has_key;
            });
        }
    }
}
