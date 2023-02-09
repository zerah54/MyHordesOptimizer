
import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';


@Pipe({
    name: 'notInListCitizen',
})
export class NotInListCitizenPipe implements PipeTransform {
    transform(all_citizens: Citizen[], in_list_citizens: Citizen[]): Citizen[] {
        return all_citizens.filter((citizen: Citizen) => !in_list_citizens.some((in_list_citizen: Citizen) => in_list_citizen.id === citizen.id));
    }
}
