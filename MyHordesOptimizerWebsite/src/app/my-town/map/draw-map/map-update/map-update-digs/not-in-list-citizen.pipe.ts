import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../../_abstract_model/types/dig.class';


@Pipe({
    name: 'notInListCitizenDig',
    standalone: true,
})
export class NotInListCitizenDigPipe implements PipeTransform {
    transform(all_citizens: Citizen[], digs: Dig[]): Citizen[] {
        return all_citizens.filter((citizen: Citizen) => !digs.some((in_list_citizen: Dig) => in_list_citizen.digger_id === citizen.id));
    }
}
