import { Pipe, PipeTransform } from '@angular/core';
import moment, { Moment } from 'moment';
import { EMPTY, map, Observable, timer } from 'rxjs';

@Pipe({
    name: 'counterFromDate',
})
export class CounterFromDatePipe implements PipeTransform {
    transform(start?: Moment): Observable<number> {
        if (!start) return EMPTY;
        return timer(0, 1000).pipe(map(() => {
            return Math.floor(moment().diff(start) / 1000);
        }));
    }
}

@Pipe({
    name: 'diffBetweenDates',
})
export class DiffBetweenDatesPipe implements PipeTransform {
    transform(start?: Moment, end?: Moment): number | undefined {
        if (!start || !end) return undefined;
        return Math.floor(end.diff(start) / 1000);
    }
}
