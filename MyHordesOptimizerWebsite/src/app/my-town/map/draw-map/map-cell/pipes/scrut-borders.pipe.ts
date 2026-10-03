import { Pipe, PipeTransform } from '@angular/core';

import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { MapOptions } from '../../../map.component';

/**
 * Une case porte un filet de scrutateur du côté où sa zone de régénération change, et seulement
 * si cette zone est demandée à l'affichage.
 */
function crossesScrutZone(cell: Cell, neighbour: Cell | undefined, options: MapOptions): boolean {
    if (!neighbour) return false;
    if (neighbour.zone_regen?.key === cell.zone_regen?.key) return false;
    return !!options.displayed_scrut_zone[<string>cell.zone_regen?.key];
}

@Pipe({
    name: 'scrutBorderLeft'
})
export class ScrutBorderLeft implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesScrutZone(cell, drawed_map[cell.y]?.[cell.x - 1], options);
    }
}

@Pipe({
    name: 'scrutBorderRight'
})
export class ScrutBorderRight implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesScrutZone(cell, drawed_map[cell.y]?.[cell.x + 1], options);
    }
}

@Pipe({
    name: 'scrutBorderTop'
})
export class ScrutBorderTop implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesScrutZone(cell, drawed_map[cell.y - 1]?.[cell.x], options);
    }
}

@Pipe({
    name: 'scrutBorderBottom'
})
export class ScrutBorderBottom implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesScrutZone(cell, drawed_map[cell.y + 1]?.[cell.x], options);
    }
}
