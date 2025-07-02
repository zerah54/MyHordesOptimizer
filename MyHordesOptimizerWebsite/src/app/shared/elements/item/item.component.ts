import { CommonModule, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, DestroyRef, inject, input, InputSignalWithTransform, model, ModelSignal, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { WishlistService } from '../../../_abstract_model/services/wishlist.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { getTown } from '../../utilities/localstorage.util';
import { RecipeComponent } from '../recipe/recipe.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, NgClass, NgOptimizedImage];
const components: Imports = [RecipeComponent];
const pipes: Imports = [DecimalPipe];
const material_modules: Imports = [MatButtonModule, MatDividerModule];

@Component({
    selector: 'mho-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ItemComponent implements OnInit {

    /** L'élément à afficher si c'est un objet standard */
    public item: ModelSignal<Item> = model.required();
    /** Force l'ouverture de l'élément */
    public forceOpen: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    public display_mode: 'simple' | 'advanced' = 'simple';
    public town: TownDetails | null = getTown();

    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    constructor(private wishlist_services: WishlistService) {
    }

    public ngOnInit(): void {
        if (this.forceOpen()) {
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
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                let new_item: Item = this.item()
                new_item.wishlist_count = 1;
                this.item.set(new_item);
            });
    }

    public toggleAdvancedMode(): void {
        if (this.forceOpen()) {
            this.display_mode = 'advanced';
        } else {
            this.display_mode = this.display_mode === 'simple' ? 'advanced' : 'simple';
        }
    }
}

