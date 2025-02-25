import { Pipe, PipeTransform } from '@angular/core';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';


@Pipe({
    name: 'totalPdc',
    pure: false
})
export class TotalPdcPipe implements PipeTransform {
    transform(expedition_part: ExpeditionPart): number {
        if (!expedition_part?.citizens) return 0;

        return expedition_part.citizens.reduce((accumulator: number, citizen: CitizenExpedition): number => {
            if (!citizen) return +accumulator;
            return +accumulator + (citizen.pdc ? +citizen.pdc : 0);
        }, 0);
    }
}
