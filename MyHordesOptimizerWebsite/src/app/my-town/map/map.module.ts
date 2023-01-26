import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { CompassRoseComponent } from './compass-rose/compass-rose.component';
import { AreAllScrutDirectionsSelectedPipe, IsScrutDirectionSelectedPipe } from './compass-rose/is-scrut-direction-selected.pipe';
import { DrawMapComponent } from './draw-map/draw-map.component';
import { MapBorderComponent } from './draw-map/map-border/map-border.component';
import { CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe } from './draw-map/map-cell-details/cell-details-position.pipe';
import { CitizenNamesPipe } from './draw-map/map-cell-details/citizen_name.pipe';
import { ItemDetailsPipe } from './draw-map/map-cell-details/item-details.pipe';
import { MapCellDetailsComponent } from './draw-map/map-cell-details/map-cell-details.component';
import { RuinInCell } from './draw-map/map-cell-details/ruin-in-cell.pipe';
import { BorderBottom, BorderLeft, BorderRight, BorderTop } from './draw-map/map-cell/borders.pipe';
import { DigLevelPipe } from './draw-map/map-cell/dig-level.pipe';
import { IsRuinPipe } from './draw-map/map-cell/is_ruin.pipe';
import { MapCellComponent } from './draw-map/map-cell/map-cell.component';
import { MyCellPipe } from './draw-map/map-cell/my-cell.pipe';
import { MapComponent } from './map.component';

let components: Components = [MapComponent];
let map_components: Components = [DrawMapComponent, MapCellComponent, MapBorderComponent, CompassRoseComponent, MapCellDetailsComponent]
let pipes: Components = [
    IsRuinPipe, DigLevelPipe, BorderLeft, BorderRight, BorderTop, BorderBottom, MyCellPipe, AreAllScrutDirectionsSelectedPipe, IsScrutDirectionSelectedPipe,
    CellDetailsLeftPipe, CellDetailsBottomPipe, CellDetailsRightPipe, CellDetailsTopPipe, CitizenNamesPipe, ItemDetailsPipe, RuinInCell
];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components,
        ...pipes,
        ...map_components
    ],
    exports: [...components],
    providers: [AreAllScrutDirectionsSelectedPipe]
})

export class MapModule {
}

