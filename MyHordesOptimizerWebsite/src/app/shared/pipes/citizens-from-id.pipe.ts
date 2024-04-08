import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { getCitizenFromId } from '../utilities/citizen.util';


@Pipe({
    name: 'citizenFromId',
    standalone: true,
})
export class CitizenFromIdPipe implements PipeTransform {
    transform(citizen_id: number, all_citizens: Citizen[]): Citizen | undefined {
        return getCitizenFromId(all_citizens, citizen_id);
    }
}
