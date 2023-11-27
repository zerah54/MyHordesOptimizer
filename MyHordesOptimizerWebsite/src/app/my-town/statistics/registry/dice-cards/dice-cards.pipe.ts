import { Pipe, PipeTransform } from '@angular/core';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { normalizeString } from '../../../../shared/utilities/string.utils';


@Pipe({
    name: 'citizenUseDiceOrCards',
    standalone: true,
})
export class CitizenUseDiceOrCardsPipe implements PipeTransform {
    transform(entries: Entry[], complete_citizen_list: CitizenInfo, reverse?: boolean): string[] {
        const citizen_for_entry: string[] = [];
        let citizen_to_write: string[] = [];

        entries.forEach((entry: Entry): void => {
            const citizen: Citizen | undefined = complete_citizen_list.citizens.find((citizen: Citizen): boolean => entry.entry?.indexOf(citizen.name) > -1);
            if (citizen && !citizen_for_entry.some((citizen_in_list: string): boolean => citizen_in_list === citizen.name)) {
                citizen_for_entry.push(citizen.name);
            }
        });

        if (reverse) {
            citizen_to_write = complete_citizen_list.citizens
                .filter((citizen: Citizen) => {
                    return !citizen_for_entry.some((citizen_in_list: string): boolean => citizen_in_list === citizen.name);
                })
                .map((citizen: Citizen) => {
                    return citizen.name;
                });
        } else {
            citizen_to_write = citizen_for_entry;
        }

        citizen_to_write = citizen_to_write.sort((citizen_a: string, citizen_b: string) => {
            return normalizeString(citizen_a).localeCompare(normalizeString(citizen_b));
        });
        return citizen_to_write;

    }
}
