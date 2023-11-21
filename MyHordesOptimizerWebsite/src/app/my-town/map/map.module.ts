import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { CompassRoseComponent } from './compass-rose/compass-rose.component';
import { AreAllScrutDirectionsSelectedPipe, IsScrutDirectionSelectedPipe } from './compass-rose/is-scrut-direction-selected.pipe';
import { DrawMapComponent } from './draw-map/draw-map.component';
import { MapBorderComponent } from './draw-map/map-border/map-border.component';
import { CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe } from './draw-map/map-cell-details/cell-details-position.pipe';
import { MapCellDetailsComponent } from './draw-map/map-cell-details/map-cell-details.component';
import { RuinInCell } from './draw-map/map-cell-details/ruin-in-cell.pipe';
import { MapCellComponent } from './draw-map/map-cell/map-cell.component';
import { DigLevelPipe } from './draw-map/map-cell/pipes/dig-level.pipe';
import { DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop } from './draw-map/map-cell/pipes/dist-borders.pipe';
import { IsRuinPipe } from './draw-map/map-cell/pipes/is_ruin.pipe';
import { MyCellPipe } from './draw-map/map-cell/pipes/my-cell.pipe';
import { ScrutBorderBottom, ScrutBorderLeft, ScrutBorderRight, ScrutBorderTop } from './draw-map/map-cell/pipes/scrut-borders.pipe';
import { TrashLevelPipe } from './draw-map/map-cell/pipes/trash-level.pipe';
import { TrashValuePipe } from './draw-map/map-cell/pipes/trash-value.pipe';
import { ItemsInBagsPipe } from './draw-map/map-update/map-update-cell/items-in-bags.pipe';
import { MapUpdateCellComponent } from './draw-map/map-update/map-update-cell/map-update-cell.component';
import { HasStillHeroicPipe } from './draw-map/map-update/map-update-citizens/has-still-heroic.pipe';
import { MapUpdateCitizensComponent } from './draw-map/map-update/map-update-citizens/map-update-citizens.component';
import { NotInListCitizenPipe } from './draw-map/map-update/map-update-citizens/not-in-list-citizen.pipe';
import { DigsPerDayPipe } from './draw-map/map-update/map-update-digs/digs-per-day.pipe';
import { MapUpdateDigsComponent } from './draw-map/map-update/map-update-digs/map-update-digs.component';
import { NotInListCitizenDigPipe } from './draw-map/map-update/map-update-digs/not-in-list-citizen.pipe';
import { MapUpdateRuinComponent } from './draw-map/map-update/map-update-ruin/map-update-ruin.component';
import { MapUpdateComponent } from './draw-map/map-update/map-update.component';
import { MapComponent } from './map.component';

const components: Components = [MapComponent];
const map_components: Components = [
    DrawMapComponent, MapCellComponent, MapBorderComponent, CompassRoseComponent, MapCellDetailsComponent, MapUpdateComponent, MapUpdateCellComponent,
    MapUpdateRuinComponent, MapUpdateCitizensComponent, MapUpdateDigsComponent
];
const pipes: Components = [
    IsRuinPipe, DigLevelPipe, ScrutBorderLeft, ScrutBorderRight, ScrutBorderTop, ScrutBorderBottom, MyCellPipe, AreAllScrutDirectionsSelectedPipe,
    IsScrutDirectionSelectedPipe, CellDetailsLeftPipe, CellDetailsBottomPipe, CellDetailsRightPipe, CellDetailsTopPipe, RuinInCell, HasStillHeroicPipe,
    ItemsInBagsPipe, DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop, NotInListCitizenPipe, NotInListCitizenDigPipe, DigsPerDayPipe,
    TrashValuePipe, TrashLevelPipe
];

@NgModule({
    imports: [SharedModule, ...components,
        ...pipes,
        ...map_components],
    exports: [...components],
    providers: [AreAllScrutDirectionsSelectedPipe]
})

export class MapModule {
}

