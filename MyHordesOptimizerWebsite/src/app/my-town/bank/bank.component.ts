import { Component, HostBinding, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { Action } from 'src/app/_abstract_model/enum/action.enum';
import { Property } from 'src/app/_abstract_model/enum/property.enum';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { ApiServices } from '../../_abstract_model/services/api.services';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';

@Component({
    selector: 'mho-bank',
    templateUrl: './bank.component.html',
    styleUrls: ['./bank.component.scss']
})
export class BankComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La banque remontée par l'appel */
    public bank!: BankInfo;

    /** Les objets affichés par le filtre */
    public displayed_bank_items!: Item[];


    /** Le champ de filtre sur les objets */
    public filter_value: string = '';
    /** Le champ de filtres sur les propriétés */
    public select_value: (Property | Action)[] = [];

    /** La liste des filtres */
    public options: (Property | Action)[] = [...<Property[]>Property.getAllValues(), ...<Action[]>Action.getAllValues()];

    public readonly locale: string = moment.locale();

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getBank()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((bank: BankInfo) => {
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
            });
    }

    public applyFilters(): void {
        if (this.filter_value !== null && this.filter_value !== undefined && this.filter_value !== '') {
            this.displayed_bank_items = [...this.bank.items.filter((bank_item: Item) => bank_item.label[this.locale].toLowerCase().indexOf(this.filter_value.toLowerCase()) > -1)];
        } else {
            this.displayed_bank_items = [...this.bank.items];
        }

        if (this.select_value && this.select_value.length > 0) {
            this.displayed_bank_items = this.displayed_bank_items.filter((item: Item) => {
                const item_actions_and_properties: (Action | Property)[] = [...item.actions.filter((action: Action) => action), ...item.properties.filter((property: Property) => property)];
                return item_actions_and_properties.some((action_or_property: Action | Property) => this.select_value.some((selected: Action | Property) => selected.key === action_or_property.key));
            });
        }
    }

}
