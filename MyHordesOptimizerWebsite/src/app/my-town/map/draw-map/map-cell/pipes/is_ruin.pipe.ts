import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Ruin } from '../../../../../_abstract_model/types/ruin.class';


@Pipe({
    name: 'isRuin'
})
export class IsRuinPipe implements PipeTransform {
    transform(cell: Cell, ruins: Ruin[]): boolean {
        if (!ruins) return false;
        return ruins.find((ruin: Ruin) => ruin.id === cell.ruin_id)?.explorable || false;
    }
}
