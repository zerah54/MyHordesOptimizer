import { Pipe, PipeTransform } from '@angular/core';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { groupBy } from '../../../../shared/utilities/array.util';


@Pipe({
    name: 'well',
    standalone: true,
})
export class WellPipe implements PipeTransform {
    transform(entries: Entry[], complete_citizen_list: CitizenInfo, display_pseudo: 'simple' | 'id_mh'): { citizen: string, rations: number }[] {

        const rations_per_citizen: { citizen: Citizen, rations: number }[] = complete_citizen_list.citizens
            .map((citizen: Citizen): { citizen: Citizen, rations: number } => {
                return {
                    citizen: citizen,
                    rations: entries.filter((entry: Entry): boolean => entry.entry.indexOf(citizen.name) > -1).length
                };
            })
            .sort((entry_a: { citizen: Citizen, rations: number }, entry_b: { citizen: Citizen, rations: number }) => {
                return entry_b.rations - entry_a.rations;
            });

        return groupBy(
            rations_per_citizen,
            (item: { citizen: Citizen, rations: number }) => item.rations
        )
            .map((rations: { citizen: Citizen, rations: number }[]) => {
                return {
                    rations: rations[0].rations,
                    citizen: rations.map((citizen: { citizen: Citizen, rations: number }) => citizen.citizen).map((citizen: Citizen) => {
                        return display_pseudo === 'simple' ? citizen.name : citizen.getTag();
                    }).join(', ')
                };
            });
    }
}
