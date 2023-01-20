import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { DrawMapComponent } from './draw-map/draw-map.component';
import { MapBorderComponent } from './draw-map/map-border/map-border.component';
import { BorderBottom, BorderLeft, BorderRight, BorderTop } from './draw-map/map-cell/borders.pipe';
import { DigLevelPipe } from './draw-map/map-cell/dig-level.pipe';
import { IsRuinPipe } from './draw-map/map-cell/is_ruin.pipe';
import { MapCellComponent } from './draw-map/map-cell/map-cell.component';
import { MapComponent } from './map.component';

let components: Components = [MapComponent];
let map_components: Components = [DrawMapComponent, MapCellComponent, MapBorderComponent]
let pipes: Components = [IsRuinPipe, DigLevelPipe, BorderLeft, BorderRight, BorderTop, BorderBottom];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components,
        ...pipes,
        ...map_components
    ],
    exports: [...components]
})

export class MapModule {
}

