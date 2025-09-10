import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Watchman } from '../../_abstract_model/types/watchman.class';


@Pipe({
    name: 'citizensForWatch', pure: false
})
export class CitizensForWatchPipe implements PipeTransform {
    transform(all_citizens: Citizen[], watchmen: Watchman[]): Citizen[] {
        return all_citizens.filter((citizen: Citizen): boolean => {
            return !(citizen.is_dead || watchmen.some((watchman: Watchman) => watchman.citizen?.id === citizen?.id));
        });
    }
}
