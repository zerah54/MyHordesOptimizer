import { Pipe, PipeTransform } from '@angular/core';
import { Estimations } from '../../../_abstract_model/types/estimations.class';


@Pipe({
    name: 'selectedDayEstimation',
    standalone: true,
})
export class SelectedDayEstimationPipe implements PipeTransform {
    transform(estimations: Estimations[], selected_day: number): Estimations {
        if (!estimations) return new Estimations();
        return <Estimations>estimations.find((estimation: Estimations) => estimation.day === selected_day);
    }
}
