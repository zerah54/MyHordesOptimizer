import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment from 'moment';
import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { FilterFieldComponent } from '../../shared/elements/filter-field/filter-field.component';
import { ItemComponent } from '../../shared/elements/item/item.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { ItemsGroupByCategoryPipe } from '../../shared/pipes/items-group-by-category.pipe';
import { normalizeString } from '../../shared/utilities/string.utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [FilterFieldComponent, ItemComponent, SelectComponent];
const pipes: Imports = [ItemsGroupByCategoryPipe];
const material_modules: Imports = [MatCardModule, MatFormFieldModule];

@Component({
    selector: 'mho-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ItemsComponent implements OnInit {

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

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.api.getItems(true)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((items: Item[]) => {
                this.items = items;
                if (this.items) {
                    this.items = this.items.sort((item_a: Item, item_b: Item) => {
                        if (item_a.category.ordering < item_b.category.ordering) return -1;
                        if (item_a.category.ordering > item_b.category.ordering) return 1;
                        return 0;
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
                    ...item.properties?.filter((property: Property) => property)
                ];
                const item_has_action_or_property: boolean = item_actions_and_properties.some((action_or_property: Action | Property) => {
                    return this.select_value.some((selected: Action | Property) => selected?.key === action_or_property?.key);
                });
                const item_has_key: boolean = this.select_value.some((filter: Property | Action) => (<{ [key: string]: unknown }><unknown>item)[filter?.key]);
                return item_has_action_or_property || item_has_key;
            });
        }
    }
}
