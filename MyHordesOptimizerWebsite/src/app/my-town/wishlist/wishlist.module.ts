import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { IsItemDisplayedPipe } from './is-item-displayed.pipe';
import { WishlistComponent } from './wishlist.component';

const components: Components = [WishlistComponent];
const pipes: Components = [IsItemDisplayedPipe];

@NgModule({
    imports: [SharedModule, ...components, ...pipes],
    exports: [...components]
})

export class WishlistModule {
}

