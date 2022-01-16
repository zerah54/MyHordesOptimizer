import { Component, OnInit } from '@angular/core';
import { ApiServices } from './../../_abstract_model/services/api.services';
import { BankInfo } from './../../_abstract_model/types/bank-info.class';

@Component({
    selector: 'mho-bank',
    templateUrl: './bank.component.html',
    styleUrls: ['./bank.component.scss']
})
export class BankComponent implements OnInit {

    public bank!: BankInfo;

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getBank().subscribe((bank: BankInfo) => {
            this.bank = bank;
            console.log('this.bank', this.bank);
            // bank.bank = Object.keys(bank.bank).map((key) => bank.bank[key])
            //     .map((bank_info) => {
            //     bank_info.item.category = getCategory(bank_info.item.category);
            //     bank_info.item.count = bank_info.count;
            //     bank_info.item.wishListCount = bank_info.wishListCount;
            //     bank_info = bank_info.item;
            //     return bank_info;
            // })
            //     .sort((item_a, item_b) => item_a.category.ordering > item_b.category.ordering);

        });
    }
}
