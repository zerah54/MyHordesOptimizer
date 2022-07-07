import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
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

    private locale: string = moment.locale();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getBank().subscribe((bank: BankInfo) => {
            this.bank = bank;
            if (this.bank) {
                this.bank.bank_items = this.bank?.bank_items
                    .sort((bank_item_a: BankItem, bank_item_b: BankItem) => bank_item_a.item.category.localeCompare(bank_item_b.item.category))
                this.displayed_bank_items = [...this.bank.bank_items];
            }
        });
    }

    public applyFilter(value: string): void {
        if (value !== null && value !== undefined && value !== '') {
            this.displayed_bank_items = [...this.bank.bank_items.filter((bank_item: BankItem) => bank_item.item.label[this.locale].toLowerCase().indexOf(value.toLowerCase()) > -1)]
        } else {
            this.displayed_bank_items = [...this.bank.bank_items]
        }
    }
}
