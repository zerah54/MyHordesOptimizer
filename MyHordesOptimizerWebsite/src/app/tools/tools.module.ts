import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { BankComponent } from './bank/bank.component';
import { CitizensComponent } from './citizens/citizens.component';
import { EstimationComponent } from './estimation/estimation.component';
import { ToolsComponent } from './tools.component';
import { WikiRoutingModule } from './tools.routing.module';
import { WishlistComponent } from './wishlist/wishlist.component';

let components: any[] = [ToolsComponent, BankComponent, CitizensComponent, WishlistComponent, EstimationComponent];

@NgModule({
    imports: [SharedModule, WikiRoutingModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class ToolsModule {
}

