import { Pipe, PipeTransform } from '@angular/core';

import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { MapOptions } from '../../../map.component';


@Pipe({
    name: 'digLevel'
})
export class DigLevelPipe implements PipeTransform {
    public transform(cell: Cell, option: MapOptions): number {
        /** Le relevé d'un fouineur est une information certaine : il prime sur l'estimation */
        if (cell.scav_zone_level !== null && cell.scav_zone_level !== undefined) {
            return cell.scav_zone_level;
        }
        const compare_value: number = (option.dig_mode === 'max' ? cell.max_potential_remaining_dig : cell.average_potential_remaining_dig) - cell.total_success;
        if (compare_value === 0) return 0;
        if (compare_value <= 4) return 1;
        if (compare_value <= 8) return 2;
        return 3;
    }
}
