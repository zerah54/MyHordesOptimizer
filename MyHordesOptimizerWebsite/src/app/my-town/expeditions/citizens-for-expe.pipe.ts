import { Pipe, PipeTransform } from '@angular/core';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';


@Pipe({
    name: 'citizensForExpe',
    pure: false,
    standalone: true
})
export class CitizensForExpePipe implements PipeTransform {
    transform(all_citizens: Citizen[], expedition_citizen: CitizenExpedition, current_expedition: Expedition, all_expeditions: Expedition[]): Citizen[] {
        if (!expedition_citizen.preinscrit_job) return all_citizens;

        return all_citizens.filter((citizen: Citizen): boolean => {
            if (citizen.is_dead) return false;
            if (citizen.job?.key !== expedition_citizen.preinscrit_job?.key) return false;
            // const is_already_placed: boolean = all_expeditions
            //     .filter((expedition: Expedition) => {
            //         return expedition.id !== current_expedition.id;
            //     })
            //     .some((expedition: Expedition) => {
            //         if (!expedition.parts || expedition.parts.length === 0) return false;
            //         return expedition.parts[0].citizens.some((part_citizen: CitizenExpedition) => part_citizen.citizen_id === expedition_citizen.citizen_id);
            //     });
            // if (is_already_placed) return false;

            all_expeditions
                .filter((expedition: Expedition) => {
                    return expedition.id !== current_expedition.id;
                })
                .forEach((expedition: Expedition) => {
                    expedition.parts.forEach((part: ExpeditionPart) => {
                        part.citizens.forEach((citizen: CitizenExpedition) => {
                            console.log('citizen', citizen);
                        });
                    });
                });
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
