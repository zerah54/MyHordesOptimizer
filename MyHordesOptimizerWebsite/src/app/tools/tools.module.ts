import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Modules } from '../_abstract_model/types/_types';
import { BankModule } from './bank/bank.module';
import { CampingModule } from './camping/camping.module';
import { CitizensModule } from './citizens/citizens.module';
import { EstimationModule } from './estimation/estimation.module';
import { MapModule } from './map/map.module';
import { ToolsRoutingModule } from './tools.routing.module';
import { WishlistModule } from './wishlist/wishlist.module';

let modules: Modules = [BankModule, CampingModule, CitizensModule, EstimationModule, MapModule, WishlistModule]

@NgModule({
    imports: [SharedModule, ToolsRoutingModule, ...modules],
    exports: [...modules]
})

export class ToolsModule {
}

