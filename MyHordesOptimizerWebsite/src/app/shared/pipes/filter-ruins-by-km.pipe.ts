import { Pipe, PipeTransform } from '@angular/core';
import { getTown } from '../utilities/localstorage.util';
import { Ruin } from '../../_abstract_model/types/ruin.class';

@Pipe({
    name: 'filterRuinsByKm'
})
export class FilterRuinsByKmPipe implements PipeTransform {

    transform(ruins: Ruin[], km: string | number): Ruin[] {
        if (!ruins) return [];
        if (getTown()?.town_type === 'PANDE') return ruins;
        if (km === '' || km === null || km === undefined) return ruins;

        return ruins.filter((ruin: Ruin) => +km >= ruin.min_dist && +km <= ruin.max_dist);
    }

}
