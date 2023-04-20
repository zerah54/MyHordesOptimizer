import { NgModule } from '@angular/core';
import { IsItemDisplayedPipe } from './is-item-displayed.pipe';
import { WishlistComponent } from './wishlist.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';

const components: Components = [WishlistComponent];
const pipes: Components = [IsItemDisplayedPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [...components, ...pipes],
    exports: [...components]
})

export class WishlistModule {
}

