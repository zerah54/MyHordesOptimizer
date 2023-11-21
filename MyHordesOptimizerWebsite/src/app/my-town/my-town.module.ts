import { NgModule } from '@angular/core';
import { Modules } from '../_abstract_model/types/_types';
import { SharedModule } from '../shared/shared.module';
import { BankModule } from './bank/bank.module';
import { BuildingsModule } from './buildings/buildings.module';
import { CampingsModule } from './campings/campings.module';
import { CitizensModule } from './citizens/citizens.module';
import { ExpeditionsModule } from './expeditions/expeditions.module';
import { MapModule } from './map/map.module';
import { NightwatchModule } from './nightwatch/nightwatch.module';
import { StatisticsModule } from './statistics/statistics.module';
import { WishlistModule } from './wishlist/wishlist.module';

const modules: Modules = [
    CitizensModule, BankModule, MapModule, StatisticsModule, WishlistModule, NightwatchModule, BuildingsModule, CampingsModule, ExpeditionsModule
];

@NgModule({
    imports: [SharedModule, ...modules],
    exports: [...modules]
})

export class MyTownModule {
}

