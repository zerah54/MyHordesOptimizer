import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { LocalStorageService } from '../../../../../shared/services/localstorage.service';
import { getUserId } from '../../../../../shared/utilities/localstorage.util';


@Pipe({
    name: 'myCell',
    standalone: true,
})
export class MyCellPipe implements PipeTransform {
    transform(cell: Cell, local_storage: LocalStorageService): boolean {
        return cell.citizens.some((citizen: Citizen): boolean => citizen.id === getUserId(local_storage)) || false;
    }
}
