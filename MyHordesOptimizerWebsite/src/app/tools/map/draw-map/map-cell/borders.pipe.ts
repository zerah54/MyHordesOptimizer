
import { Pipe, PipeTransform } from '@angular/core';
import { ZoneRegen } from 'src/app/_abstract_model/enum/zone-regen.enum';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { MapOptions } from '../../map.component';


@Pipe({
    name: 'borderLeft',
})
export class BorderLeft implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y][cell.x - 1]?.zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'borderRight',
})
export class BorderRight implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y][cell.x + 1]?.zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'borderTop',
})
export class BorderTop implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return (drawed_map[cell.y - 1] ? drawed_map[cell.y - 1][cell.x]?.zone_regen?.key !== cell.zone_regen?.key : false) && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'borderBottom',
})
export class BorderBottom implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return (drawed_map[cell.y + 1] ? drawed_map[cell.y + 1][cell.x]?.zone_regen?.key !== cell.zone_regen?.key : false) && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}
