import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../_abstract_model/types/cell.class';


@Pipe({
    name: 'digLevel',
})
export class DigLevelPipe implements PipeTransform {
    transform(cell: Cell, option: 'max' | 'average'): number {
        const compare_value: number = (option === 'max' ? cell.max_potential_remaining_dig : cell.average_potential_remaining_dig) - cell.total_success;
        if (compare_value === 0) return 0;
        if (compare_value <= 4) return 1;
        if (compare_value <= 8) return 2;
        return 3;
    }
}
