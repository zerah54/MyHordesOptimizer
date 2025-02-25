import { Pipe, PipeTransform } from '@angular/core';
import { Entry } from '../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { normalizeString } from '../../../shared/utilities/string.utils';


@Pipe({
    name: 'isCitizenInEntries'
})
export class IsCitizenInEntriesPipe implements PipeTransform {
    transform(entries: Entry[], complete_citizen_list: CitizenInfo, reverse?: boolean): Citizen[] {
        const citizen_for_entry: Citizen[] = [];
        let citizen_to_write: Citizen[] = [];

        entries.forEach((entry: Entry): void => {
            const citizen: Citizen | undefined = complete_citizen_list.citizens.find((citizen: Citizen): boolean => entry.entry?.indexOf(citizen.name) > -1);
            if (citizen && !citizen_for_entry.some((citizen_in_list: Citizen): boolean => citizen_in_list.id === citizen.id)) {
                citizen_for_entry.push(citizen);
            }
        });

        if (reverse) {
            citizen_to_write = complete_citizen_list.citizens
                .filter((citizen: Citizen) => {
                    return !citizen_for_entry.some((citizen_in_list: Citizen): boolean => citizen_in_list.id === citizen.id);
                });
        } else {
            citizen_to_write = citizen_for_entry;
        }

        citizen_to_write = citizen_to_write.sort((citizen_a: Citizen, citizen_b: Citizen) => {
            return normalizeString(citizen_a.name).localeCompare(normalizeString(citizen_b.name));
        });
        return citizen_to_write;

    }
}
