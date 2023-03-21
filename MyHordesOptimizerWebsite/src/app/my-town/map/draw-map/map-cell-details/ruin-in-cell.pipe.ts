import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';


@Pipe({
    name: 'ruinInCell',
})
export class RuinInCell implements PipeTransform {
    transform(cell: Cell, all_ruins: Ruin[]): Ruin | undefined {
        return all_ruins.find((ruin: Ruin) => ruin.id === cell.ruin_id);
    }
}
