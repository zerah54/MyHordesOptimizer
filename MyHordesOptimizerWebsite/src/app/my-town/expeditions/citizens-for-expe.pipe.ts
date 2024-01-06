import { Pipe, PipeTransform } from '@angular/core';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';


@Pipe({
    name: 'citizensForExpe',
    pure: false,
    standalone: true
})
export class CitizensForExpePipe implements PipeTransform {
    transform(all_citizens: Citizen[], expedition_citizen: CitizenExpedition): Citizen[] {
        if (!expedition_citizen.preinscrit_job) return all_citizens;

        return all_citizens.filter((citizen: Citizen): boolean => {
            if (citizen.is_dead) return false;
            if (citizen.job?.key !== expedition_citizen.preinscrit_job?.key) return false;
            return true;
        });
    }
}

@Pipe({
    name: 'someHeroicActionNeeded',
    pure: false,
    standalone: true
})
export class SomeHeroicActionNeededPipe implements PipeTransform {
    transform(expedition_citizen: CitizenExpedition[]): boolean {
        if (!expedition_citizen) return false;
        return expedition_citizen.some((citizen: CitizenExpedition): boolean => citizen.preinscrit_job !== undefined && citizen.preinscrit_job !== null);
    }
}
