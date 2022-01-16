import { Component, OnInit } from '@angular/core';
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
    /** Les objets en banque triés par catégorie */
    public bank_by_categories!: Dictionary<unknown>;

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getBank().subscribe((bank: BankInfo) => {
            this.bank = bank;
            if (this.bank) {
                this.bank.bank_items = this.bank?.bank_items
                    .sort((bank_item_a: BankItem, bank_item_b: BankItem) => bank_item_a.item.category.localeCompare(bank_item_b.item.category))
                console.log('this.bank', this.bank);
            }
        });
    }
}
