import { Item } from './../../../_abstract_model/types/item.class';
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

    /** L'élément à afficher si c'est un objet de banque */
    @Input() bank_item!: BankItem;
    /** L'élément à afficher si c'est un objet standard */
    @Input() item!: Item;
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
     * @param {Item} item
     */
    public addItemToWishlist(item: Item): void {
        this.api.addItemToWishlist(item).subscribe(() => {
            if (this.bank_item) {
                this.bank_item.wishlist_count = 1;
            } else {
                this.item.wishlist_count = 1;
            }
        })
    }
}

