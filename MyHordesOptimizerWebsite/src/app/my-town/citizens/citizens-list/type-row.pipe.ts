import { Pipe, PipeTransform } from '@angular/core';

import { Citizen } from '../../../_abstract_model/types/citizen.class';


@Pipe({
    name: 'typeRow'
})
export class TypeRowPipe implements PipeTransform {
    public transform(row: Citizen): Citizen {
        return row;
    }
}
