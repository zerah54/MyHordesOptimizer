
import { Pipe, PipeTransform } from '@angular/core';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';


@Pipe({
    name: 'citizenNames',
})
export class CitizenNamesPipe implements PipeTransform {
    transform(citizens: Citizen[], all_citizens: Citizen[]): Citizen[] {
        return all_citizens.filter((citizen_in_all: Citizen) => citizens.some((citizen: Citizen) => citizen.id === citizen_in_all.id));
    }
}
