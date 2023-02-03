
import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { MapOptions } from '../../map.component';


@Pipe({
    name: 'scrutBorderLeft',
})
export class ScrutBorderLeft implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y][cell.x - 1] && drawed_map[cell.y][cell.x - 1].zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'scrutBorderRight',
})
export class ScrutBorderRight implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y][cell.x + 1] && drawed_map[cell.y][cell.x + 1].zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'scrutBorderTop',
})
export class ScrutBorderTop implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y - 1] && drawed_map[cell.y - 1][cell.x]?.zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'scrutBorderBottom',
})
export class ScrutBorderBottom implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y + 1] && drawed_map[cell.y + 1][cell.x]?.zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

