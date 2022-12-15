import { CampingComponent } from './camping/camping.component';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { BankComponent } from './bank/bank.component';
import { CitizensComponent } from './citizens/citizens.component';
import { EstimationComponent } from './estimation/estimation.component';
import { ToolsRoutingModule } from './tools.routing.module';
import { WishlistComponent } from './wishlist/wishlist.component';
import { FilterRuinsByKmPipe } from './camping/filter-ruins-by-km.pipe';

let components: any[] = [BankComponent, CitizensComponent, WishlistComponent, EstimationComponent, CampingComponent];
let pipes: any[] = [FilterRuinsByKmPipe];

@NgModule({
    imports: [SharedModule, ToolsRoutingModule],
    declarations: [
        ...components,
        ...pipes
    ],
    exports: [...components]
})

export class ToolsModule {
}

