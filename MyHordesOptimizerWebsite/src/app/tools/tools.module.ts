import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Components } from '../_abstract_model/types/_types';
import { BankComponent } from './bank/bank.component';
import { CampingComponent } from './camping/camping.component';
import { FilterRuinsByKmPipe } from './camping/filter-ruins-by-km.pipe';
import { CitizensComponent } from './citizens/citizens.component';
import { EstimationComponent } from './estimation/estimation.component';
import { DrawMapComponent } from './map/draw-map/draw-map.component';
import { MapBorderComponent } from './map/draw-map/map-border/map-border.component';
import { MapCellComponent } from './map/draw-map/map-cell/map-cell.component';
import { MapComponent } from './map/map.component';
import { ToolsRoutingModule } from './tools.routing.module';
import { WishlistComponent } from './wishlist/wishlist.component';

let components: Components = [BankComponent, CitizensComponent, WishlistComponent, EstimationComponent, CampingComponent, MapComponent];
let map_components: Components = [DrawMapComponent, MapCellComponent, MapBorderComponent]
let pipes: Components = [FilterRuinsByKmPipe];

@NgModule({
    imports: [SharedModule, ToolsRoutingModule],
    declarations: [
        ...components,
        ...pipes,
        ...map_components
    ],
    exports: [...components]
})

export class ToolsModule {
}

