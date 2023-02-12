import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { IsItemDisplayedPipe } from './is-item-displayed.pipe';
import { WishlistComponent } from './wishlist.component';

let components: Components = [WishlistComponent];
let pipes: Components = [IsItemDisplayedPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [...components, ...pipes],
    exports: [...components]
})

export class WishlistModule {
}

