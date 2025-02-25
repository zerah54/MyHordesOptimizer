import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { getCitizenFromId } from '../utilities/citizen.util';


@Pipe({
    name: 'citizenFromId'
})
export class CitizenFromIdPipe implements PipeTransform {
    transform(citizen_id: number | undefined, all_citizens: Citizen[]): Citizen | undefined {
        if (!citizen_id) return undefined;
        return getCitizenFromId(all_citizens, citizen_id);
    }
}
