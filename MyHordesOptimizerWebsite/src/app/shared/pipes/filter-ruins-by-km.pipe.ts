import { Pipe, PipeTransform } from '@angular/core';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { LocalStorageService } from '../services/localstorage.service';
import { getTown } from '../utilities/localstorage.util';

@Pipe({
    name: 'filterRuinsByKm',
    standalone: true
})
export class FilterRuinsByKmPipe implements PipeTransform {

    transform(ruins: Ruin[], km: string | number, local_storage: LocalStorageService): Ruin[] {
        if (!ruins) return [];
        if (getTown(local_storage)?.town_type === 'PANDE') return ruins;
        if (km === '' || km === null || km === undefined) return ruins;

        return ruins.filter((ruin: Ruin) => +km >= ruin.min_dist && +km <= ruin.max_dist);
    }

}
