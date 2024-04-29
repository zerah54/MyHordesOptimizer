import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { BANK_CONDENSED_DISPLAY_KEY, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { FilterFieldComponent } from '../../shared/elements/filter-field/filter-field.component';
import { ItemComponent } from '../../shared/elements/item/item.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { ItemsGroupByCategoryPipe } from '../../shared/pipes/items-group-by-category.pipe';
import { normalizeString } from '../../shared/utilities/string.utils';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [FilterFieldComponent, ItemComponent, SelectComponent];
const pipes: Imports = [ItemsGroupByCategoryPipe];
const material_modules: Imports = [MatCardModule, MatFormFieldModule, MatSlideToggleModule, MatTooltipModule];

@Component({
    selector: 'mho-bank',
    templateUrl: './bank.component.html',
    styleUrls: ['./bank.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class BankComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La banque remontée par l'appel */
    public bank!: BankInfo;

    /** Les objets affichés par le filtre */
    public displayed_bank_items!: Item[];
    /** L'objet dont le détail est affiché */
    public detailed_item!: Item;


    /** Le champ de filtre sur les objets */
    public filter_value: string = '';
    /** Le champ de filtres sur les propriétés */
    public select_value: (Property | Action)[] = [];

    public condensed_display: boolean = JSON.parse(localStorage.getItem(BANK_CONDENSED_DISPLAY_KEY) || 'false');

    /** La liste des filtres */
    public options: (Property | Action)[] = [...<Property[]>Property.getAllValues(), ...<Action[]>Action.getAllValues()];

    public readonly locale: string = moment.locale();
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    ngOnInit(): void {
        this.town_service
            .getBank(true)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (bank: BankInfo) => {
                    this.bank = bank;
                    if (this.bank) {
                        this.bank.items = this.bank?.items
                            .sort((bank_item_a: Item, bank_item_b: Item) => {
                                if (bank_item_a.category.ordering < bank_item_b.category.ordering) {
                                    return -1;
                                } else if (bank_item_a.category.ordering === bank_item_b.category.ordering) {
                                    return 0;
                                } else {
                                    return 1;
                                }
                            });
                        this.displayed_bank_items = [...this.bank.items];
                    }
                }
            });
    }

    public applyFilters(): void {
        if (this.filter_value !== null && this.filter_value !== undefined && this.filter_value !== '') {
            this.displayed_bank_items = [...this.bank.items.filter((bank_item: Item) => normalizeString(bank_item.label[this.locale]).indexOf(normalizeString(this.filter_value)) > -1)];
        } else {
            this.displayed_bank_items = [...this.bank.items];
        }

        if (this.select_value && this.select_value.length > 0) {
            this.displayed_bank_items = this.displayed_bank_items.filter((item: Item) => {
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

    /**
     * Enregistre le mode d'affichage de la banque
     */
    public changeCondensedDisplay(): void {
        localStorage.setItem(BANK_CONDENSED_DISPLAY_KEY, JSON.stringify(this.condensed_display));
    }
}
