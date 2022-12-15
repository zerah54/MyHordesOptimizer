import { Pipe, PipeTransform } from '@angular/core';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';

@Pipe({
  name: 'filterRuinsByKm'
})
export class FilterRuinsByKmPipe implements PipeTransform {

  transform(ruins: Ruin[], km: string): Ruin[] {
    if (!ruins) return [];
    if (km === '' || km === null || km === undefined) return ruins;

    return ruins.filter((ruin: Ruin) => +km >= ruin.min_dist && +km <= ruin.max_dist);
  }

}
