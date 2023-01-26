import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from './../../../_abstract_model/const';
import { ApiServices } from './../../../_abstract_model/services/api.services';
import { Item } from './../../../_abstract_model/types/item.class';

@Component({
    selector: 'mho-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})
export class ItemComponent {
    @HostBinding('style.display') display: string = 'contents';

    /** L'élément à afficher si c'est un objet standard */
    @Input() item!: Item;

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    public display_mode: 'simple' | 'advanced' = 'simple';

    constructor(private api: ApiServices) {
    }

    /**
     * Ajoute un élément à la liste de souhaits
     *
     * @param {Item} item
     */
    public addItemToWishlist(item: Item): void {
        this.api.addItemToWishlist(item).subscribe(() => {
            this.item.wishlist_count = 1;
        })
    }

    public toggleAdvancedMode(): void {
        this.display_mode = this.display_mode === 'simple' ? 'advanced' : 'simple';
    }
}

