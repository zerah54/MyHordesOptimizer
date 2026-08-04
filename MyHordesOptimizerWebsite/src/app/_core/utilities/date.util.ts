import { formatNumber } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import moment, { Moment } from 'moment';
import { EMPTY, map, Observable, timer } from 'rxjs';

@Pipe({
    name: 'counterFromDate',
})
export class CounterFromDatePipe implements PipeTransform {
    public transform(start?: Moment): Observable<number> {
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
    public transform(start?: Moment, end?: Moment): number | undefined {
        if (!start || !end) return undefined;
        return Math.floor(end.diff(start) / 1000);
    }
}

/** Millisecondes écoulées → secondes avec 2 décimales, dans le format numérique de la locale courante (ex. "12,45" en fr). */
@Pipe({
    name: 'elapsedSeconds',
})
export class ElapsedSecondsPipe implements PipeTransform {
    private readonly locale: string = inject(LOCALE_ID);

    public transform(elapsedMs: number): string {
        return formatNumber(elapsedMs / 1000, this.locale, '1.2-2');
    }
}
