import { Pipe, PipeTransform } from '@angular/core';
import { Dictionary } from '../../../_abstract_model/types/_types';


@Pipe({
    name: 'isScrutDirectionSelected',
    standalone: true,
})
export class IsScrutDirectionSelectedPipe implements PipeTransform {
    transform(selectedScrutZone: Dictionary<boolean>, direction: string): boolean {
        return selectedScrutZone[direction];
    }
}

@Pipe({
    name: 'areAllScrutDirectionsSelected',
    standalone: true,
})
export class AreAllScrutDirectionsSelectedPipe implements PipeTransform {
    transform(selectedScrutZone: Dictionary<boolean>): boolean {
        return Object.keys(selectedScrutZone).every((key: string) => selectedScrutZone[key]);
    }
}
