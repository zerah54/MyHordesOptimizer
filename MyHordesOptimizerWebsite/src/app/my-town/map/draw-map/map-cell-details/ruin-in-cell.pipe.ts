import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';


@Pipe({
    name: 'ruinInCell',
    standalone: true,
})
export class RuinInCell implements PipeTransform {
    transform(cell: Cell, all_ruins: Ruin[]): Ruin | undefined {
        return all_ruins.find((ruin: Ruin): boolean => ruin.id === cell.ruin_id);
    }
}
