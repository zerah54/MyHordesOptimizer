import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { groupBy } from '../../../shared/utilities/array.util';


@Pipe({
    name: 'citizenGroupByImmuneState'
})
export class CitizenGroupByImmuneStatePipe implements PipeTransform {

    transform(citizen: Citizen[]): ImmuneState[] {
        if (!citizen) return [];

        citizen.sort((citizen_a: Citizen, citizen_b: Citizen) => {
            if (citizen_a.chamanic_detail.is_immune_to_soul) return -1;
            if (citizen_a.chamanic_detail.nb_potion_shaman < citizen_b.chamanic_detail.nb_potion_shaman) return 1;
            if (citizen_a.chamanic_detail.nb_potion_shaman > citizen_b.chamanic_detail.nb_potion_shaman) return -1;
            return 0;
        });
        const citizen_by_immune_states: Citizen[][] = groupBy(citizen, this.groupByImmune);

        const immune_state: ImmuneState[] = citizen_by_immune_states.map((citizen_by_immune_state: Citizen[]): ImmuneState => {
            let label: string;
            if (citizen_by_immune_state[0].chamanic_detail.is_immune_to_soul) {
                label = $localize`Immunisés`;
            } else {
                const nb: number = citizen_by_immune_state[0].chamanic_detail.nb_potion_shaman;
                const plur: string = $localize`${nb} potions bues`;
                const sing: string = $localize`${nb} potion bue`;
                label = nb > 1 ? plur : sing;
            }
            citizen_by_immune_state.sort((citizen_a: Citizen, citizen_b: Citizen) => {
                if (citizen_a.name.localeCompare(citizen_b.name) > 0) return 1;
                if (citizen_a.name.localeCompare(citizen_b.name) < 0) return -1;
                return 0;
            });
            return {
                label: label,
                citizen: citizen_by_immune_state
            };
        });

        return immune_state;
    }

    private groupByImmune(citizen: Citizen): string {
        if (citizen.chamanic_detail.is_immune_to_soul) return 'immune';
        return 'drunk_' + (citizen.chamanic_detail).nb_potion_shaman;
    }

}

interface ImmuneState {
    label: string;
    citizen: Citizen[];
}
