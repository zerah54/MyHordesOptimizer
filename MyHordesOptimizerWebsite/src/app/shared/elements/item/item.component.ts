import { CommonModule, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { WishlistService } from '../../../_abstract_model/services/wishlist.service';
import { Item } from '../../../_abstract_model/types/item.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { AutoDestroy } from '../../decorators/autodestroy.decorator';
import { getTown } from '../../utilities/localstorage.util';
import { RecipeComponent } from '../recipe/recipe.component';

@Component({
    selector: 'mho-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    standalone: true,
    imports: [CommonModule, NgClass, MatButtonModule, NgOptimizedImage, MatDividerModule, RecipeComponent, DecimalPipe]
})
export class ItemComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** L'élément à afficher si c'est un objet standard */
    @Input() item!: Item;
    /** Force l'ouverture de l'élément */
    @Input() forceOpen: boolean = false;

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    public display_mode: 'simple' | 'advanced' = 'simple';
    public town: TownDetails | null = getTown();

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private wishlist_services: WishlistService) {
    }

    public ngOnInit(): void {
        if (this.forceOpen) {
            this.display_mode = 'advanced';
        }
    }

    /**
     * Ajoute un élément à la liste de souhaits
     *
     * @param {Item} item
     */
    public addItemToWishlist(item: Item): void {
        this.wishlist_services.addItemToWishlist(item, '0')
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.item.wishlist_count = 1;
            });
    }

    public toggleAdvancedMode(): void {
        if (this.forceOpen) {
            this.display_mode = 'advanced';
        } else {
            this.display_mode = this.display_mode === 'simple' ? 'advanced' : 'simple';
        }
    }
}

