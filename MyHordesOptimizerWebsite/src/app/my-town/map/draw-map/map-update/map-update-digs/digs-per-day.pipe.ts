import { Pipe, PipeTransform } from '@angular/core';
import { Dig } from '../../../../../_abstract_model/types/dig.class';


@Pipe({
    name: 'digsPerDay',
})
export class DigsPerDayPipe implements PipeTransform {
    transform(digs: Dig[], day: number): Dig[] {
        if (!digs) return [];
        return digs.filter((dig: Dig): boolean => dig.day === day);
    }
}
