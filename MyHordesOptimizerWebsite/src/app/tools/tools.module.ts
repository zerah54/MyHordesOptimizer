import { CampingComponent } from './camping/camping.component';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { BankComponent } from './bank/bank.component';
import { CitizensComponent } from './citizens/citizens.component';
import { EstimationComponent } from './estimation/estimation.component';
import { ToolsRoutingModule } from './tools.routing.module';
import { WishlistComponent } from './wishlist/wishlist.component';

let components: any[] = [BankComponent, CitizensComponent, WishlistComponent, EstimationComponent, CampingComponent];

@NgModule({
    imports: [SharedModule, ToolsRoutingModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class ToolsModule {
}

