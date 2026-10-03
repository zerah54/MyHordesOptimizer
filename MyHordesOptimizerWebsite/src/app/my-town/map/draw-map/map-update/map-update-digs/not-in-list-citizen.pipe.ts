import { Pipe, PipeTransform } from '@angular/core';

import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../../_abstract_model/types/dig.class';


@Pipe({
    name: 'notInListCitizenDig'
})
export class NotInListCitizenDigPipe implements PipeTransform {
    /** Citoyens sans fouille ce jour-là : un citoyen peut fouiller la même case plusieurs jours. */
    public transform(all_citizens: Citizen[], digs: Dig[], day: number): Citizen[] {
        return all_citizens.filter((citizen: Citizen) => !digs.some((dig: Dig) => dig.day === day && dig.digger_id === citizen.id));
    }
}
