import { Pipe, PipeTransform } from '@angular/core';
import { Dictionary } from '../../../_abstract_model/types/_types';


@Pipe({
    name: 'isDirectionSelected',
    standalone: true,
})
export class IsDirectionSelectedPipe implements PipeTransform {
    transform(selected_direction: Dictionary<boolean>, direction: string): boolean {
        return selected_direction[direction];
    }
}

@Pipe({
    name: 'areAllDirectionsSelected',
    standalone: true,
})
export class AreAllDirectionsSelectedPipe implements PipeTransform {
    transform(selected_direction: Dictionary<boolean>): boolean {
        return areAllDirectionsSelected(selected_direction);
    }
}

export function areAllDirectionsSelected(selected_direction: Dictionary<boolean>): boolean {
    return Object.keys(selected_direction).every((key: string) => selected_direction[key]);
}
