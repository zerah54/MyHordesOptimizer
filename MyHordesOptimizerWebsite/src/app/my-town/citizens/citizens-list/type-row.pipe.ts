import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../../_abstract_model/types/citizen.class';


@Pipe({
    name: 'typeRow',
    standalone: true,
})
export class TypeRowPipe implements PipeTransform {
    transform(row: Citizen): Citizen {
        return row;
    }
}
