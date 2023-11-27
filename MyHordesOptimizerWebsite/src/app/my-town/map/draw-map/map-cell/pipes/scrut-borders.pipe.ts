import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { MapOptions } from '../../../map.component';


@Pipe({
    name: 'scrutBorderLeft',
    standalone: true,
})
export class ScrutBorderLeft implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y][cell.x - 1] && drawed_map[cell.y][cell.x - 1].zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'scrutBorderRight',
    standalone: true,
})
export class ScrutBorderRight implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y][cell.x + 1] && drawed_map[cell.y][cell.x + 1].zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'scrutBorderTop',
    standalone: true,
})
export class ScrutBorderTop implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y - 1] && drawed_map[cell.y - 1][cell.x]?.zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

@Pipe({
    name: 'scrutBorderBottom',
    standalone: true,
})
export class ScrutBorderBottom implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return drawed_map[cell.y + 1] && drawed_map[cell.y + 1][cell.x]?.zone_regen?.key !== cell.zone_regen?.key && options.displayed_scrut_zone[<string>cell.zone_regen?.key];
    }
}

