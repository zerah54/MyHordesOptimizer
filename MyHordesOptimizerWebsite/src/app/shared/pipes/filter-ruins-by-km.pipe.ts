import { Pipe, PipeTransform } from '@angular/core';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { getTown } from '../utilities/localstorage.util';

@Pipe({
    name: 'filterRuinsByKm',
    standalone: true
})
export class FilterRuinsByKmPipe implements PipeTransform {

    transform(ruins: Ruin[], km: string | number): Ruin[] {
        if (!ruins) return [];
        if (getTown()?.town_type === 'PANDE') return ruins;
        if (km === '' || km === null || km === undefined) return ruins;

        return ruins.filter((ruin: Ruin) => +km >= ruin.min_dist && +km <= ruin.max_dist);
    }

}
