import { Pipe, PipeTransform } from '@angular/core';
import { Bath } from '../../../_abstract_model/types/bath.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';

@Pipe({
    name: 'citizenGroupByBathState',
    standalone: true,
})
export class CitizenGroupByBathStatePipe implements PipeTransform {

    transform(citizens: Citizen[], day: number): BathState[] {
        if (!citizens) return [];

        return [
            {label: $localize`Bain pris`, citizen: citizens.filter((citizen: Citizen) => this.hasBathForDay(citizen, day))},
            {label: $localize`Pas de bain`, citizen: citizens.filter((citizen: Citizen) => !this.hasBathForDay(citizen, day))}
        ];
    }

    private hasBathForDay(citizen: Citizen, day: number): boolean {
        return citizen.baths.some((bath: Bath) => bath.day === day && bath.update_info);
    }

}

interface BathState {
    label: string;
    citizen: Citizen[];
}
