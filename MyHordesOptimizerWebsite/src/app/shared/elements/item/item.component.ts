import { ApiServices } from './../../../_abstract_model/services/api.services';
import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from './../../../_abstract_model/const';
import { BankItem } from './../../../_abstract_model/types/bank-item.class';

@Component({
    selector: 'mho-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})
export class ItemComponent {
    @HostBinding('style.display') display: string = 'contents';

    /** L'élément à afficher */
    @Input() item!: BankItem;
    /** Doit-on afficher le détail au clic ? */
    @Input() displayDetails: boolean = false;

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();

    constructor(private api: ApiServices) {

    }

    /**
     * Ajoute un élément à la liste de souhaits
     *
     * @param {BankItem} bank_item
     */
     public addItemToWishlist(bank_item: BankItem): void {
        this.api.addItemToWishlist(bank_item.item).subscribe(() => {
            bank_item.wishlist_count = 1;
        })
    }
}

