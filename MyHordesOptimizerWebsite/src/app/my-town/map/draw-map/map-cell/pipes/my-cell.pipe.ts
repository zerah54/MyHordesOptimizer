import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { getUserId } from '../../../../../shared/utilities/localstorage.util';


@Pipe({
    name: 'myCell',
})
export class MyCellPipe implements PipeTransform {
    transform(cell: Cell): boolean {
        return cell.citizens.some((citizen: Citizen): boolean => citizen.id === getUserId()) || false;
    }
}
