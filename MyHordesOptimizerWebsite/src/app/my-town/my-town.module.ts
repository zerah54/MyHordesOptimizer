import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Modules } from '../_abstract_model/types/_types';
import { BankModule } from './bank/bank.module';
import { BuildingsModule } from './buildings/buildings.module';
import { CampingsModule } from './campings/campings.module';
import { CitizensModule } from './citizens/citizens.module';
import { MapModule } from './map/map.module';
import { MyTownRoutingModule } from './my-town.routing.module';
import { NightwatchModule } from './nightwatch/nightwatch.module';
import { StatisticsModule } from './statistics/statistics.module';
import { WishlistModule } from './wishlist/wishlist.module';

let modules: Modules = [CitizensModule, BankModule, MapModule, StatisticsModule, WishlistModule, NightwatchModule, BuildingsModule, CampingsModule]

@NgModule({
    imports: [SharedModule, MyTownRoutingModule, ...modules],
    exports: [...modules]
})

export class MyTownModule {
}

