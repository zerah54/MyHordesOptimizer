
import { Pipe, PipeTransform } from '@angular/core';
import { getUserId } from 'src/app/shared/utilities/localstorage.util';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';


@Pipe({
    name: 'myCell',
})
export class MyCellPipe implements PipeTransform {
    transform(cell: Cell): boolean {
        return cell.citizens.some((citizen: Citizen) => citizen.id === getUserId()) || false;
    }
}
