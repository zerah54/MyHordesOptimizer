import { CommonModule, DecimalPipe, NgOptimizedImage } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    input,
    InputSignalWithTransform,
    model,
    ModelSignal,
    OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { ItemImgPipe } from '../../_core/pipes/item-img.pipe';
import { getTown } from '../../_core/utilities/localstorage.util';
import { IconApComponent } from '../icon-ap/icon-ap.component';
import { IconCpComponent } from '../icon-cp/icon-cp.component';
import { RecipeComponent } from '../recipe/recipe.component';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [RecipeComponent, IconApComponent, IconCpComponent];
const pipes: Imports = [DecimalPipe, ItemImgPipe];
const material_modules: Imports = [MatButtonModule, MatDividerModule];

@Component({
    selector: 'mho-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ItemComponent implements OnInit {
    /** L'élément à afficher si c'est un objet standard */
    public item: ModelSignal<Item> = model.required();
    /** Force l'ouverture de l'élément */
    public forceOpen: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    protected readonly locale: string = moment.locale();
    protected display_mode: 'simple' | 'advanced' = 'simple';
    protected town: TownDetails | null = getTown();
    private wishlist_services: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

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
    protected addItemToWishlist(item: Item): void {
        this.wishlist_services.addItemToWishlist(item, 0)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                // Mutation en place D'ABORD : préserve le partage de référence avec le tableau
                // canonique du parent (bank.component.ts/items.component.ts filtrent via `.filter()`,
                // qui conserve les références d'objet — un clone déconnecté désynchroniserait un
                // refiltrage ultérieur). `.set()` d'un clone ENSUITE : sous OnPush, `set()` ignore une
                // valeur `Object.is`-égale à l'actuelle, il faut donc une nouvelle référence pour que
                // le signal notifie son propre template.
                const current_item: Item = this.item();
                current_item.wishlist_count = 1;
                this.item.set(Object.assign(new Item(), current_item));
            });
    }

    protected toggleAdvancedMode(): void {
        if (this.forceOpen()) {
            this.display_mode = 'advanced';
        } else {
            this.display_mode = this.display_mode === 'simple' ? 'advanced' : 'simple';
        }
    }
}

