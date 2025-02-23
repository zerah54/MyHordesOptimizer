import { Pipe, PipeTransform } from '@angular/core';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';


@Pipe({
    name: 'citizenForDig'
})
export class CitizenForDigPipe implements PipeTransform {
    transform(dig: Dig, complete_citizen_list: CitizenInfo): Citizen {
        return <Citizen>complete_citizen_list.citizens.find((citizen: Citizen): boolean => citizen.id === dig.digger_id);
    }
}

@Pipe({
    name: 'citizenNotInDigList'
})
export class CitizenNotInDigListPipe implements PipeTransform {
    transform(complete_citizen_list: CitizenInfo, digs_list: Dig[]): Citizen[] {
        return <Citizen[]>complete_citizen_list.citizens
            .filter((citizen: Citizen) => !digs_list.some((dig: Dig): boolean => dig.digger_id === citizen.id));
    }
}
