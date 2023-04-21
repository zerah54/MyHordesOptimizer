import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../_abstract_model/types/citizen.class';


@Pipe({
    name: 'citizensFromShort',
})
export class CitizensFromShortPipe implements PipeTransform {
    transform(citizens: Citizen[], all_citizens: Citizen[]): Citizen[] {
        if (!citizens) return [];
        return all_citizens.filter((citizen_in_all: Citizen) => citizens.some((citizen: Citizen) => citizen.id === citizen_in_all.id));
    }
}
