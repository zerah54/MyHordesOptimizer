import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Action } from 'src/app/_abstract_model/enum/action.enum';
import { Property } from 'src/app/_abstract_model/enum/property.enum';
import { BankItem } from 'src/app/_abstract_model/types/bank-item.class';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { ApiServices } from './../../_abstract_model/services/api.services';
import { BankInfo } from './../../_abstract_model/types/bank-info.class';
@Component({
    selector: 'mho-bank',
    templateUrl: './bank.component.html',
    styleUrls: ['./bank.component.scss']
})
export class BankComponent implements OnInit {

    /** La banque remontée par l'appel */
    public bank!: BankInfo;

    /** Les objets affichés par le filtre */
    public displayed_bank_items!: BankItem[];

    /** Les objets en banque triés par catégorie */
    public bank_by_categories!: Dictionary<unknown>;

    /** Le champ de filtre sur les objets */
    public filter_value: string = '';
    /** Le champ de filtres sur les propriétés */
    public select_value: (Property | Action)[] = [];

    /** La liste des filtres */
    public options: (Property | Action)[] = [...<any>Property.getAllValues(), ...<any>Action.getAllValues()];

    private locale: string = moment.locale();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getBank().subscribe((bank: BankInfo) => {
            this.bank = bank;
            if (this.bank) {
                this.bank.bank_items = this.bank?.bank_items
                    .sort((bank_item_a: BankItem, bank_item_b: BankItem) =>{
                        if (bank_item_a.item.category.ordering < bank_item_b.item.category.ordering) {
                            return -1;
                        } else if (bank_item_a.item.category.ordering === bank_item_b.item.category.ordering) {
                            return 0;
                        } else {
                            return 1;
                        }
                    })
                this.displayed_bank_items = [...this.bank.bank_items];
            }
        });
        console.log('options', this.options);
    }

    public applyFilters(): void {
        if (this.filter_value !== null && this.filter_value !== undefined && this.filter_value !== '') {
            this.displayed_bank_items = [...this.bank.bank_items.filter((bank_item: BankItem) => bank_item.item.label[this.locale].toLowerCase().indexOf(this.filter_value.toLowerCase()) > -1)]
        } else {
            this.displayed_bank_items = [...this.bank.bank_items]
        }

        if (this.select_value && this.select_value.length > 0) {
            this.displayed_bank_items = this.displayed_bank_items.filter((item: BankItem) => {
                const item_actions_and_properties: (Action | Property)[] = [...item.item.actions.filter((action: Action) => action), ...item.item.properties.filter((property: Property) => property)];
                console.log('item_actions_and_properties', item_actions_and_properties);
                console.log('selected', this.select_value);
                return item_actions_and_properties.some((action_or_property: Action | Property) => this.select_value.some((selected: Action | Property) => selected.key === action_or_property.key));
            });
        }
    }

}
