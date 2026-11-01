import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'daysUpTo'
})
export class DaysUpToPipe implements PipeTransform {
    /**
     * Liste les jours de J1 au dernier jour.
     * @param {number} last_day Dernier jour, inclus.
     * @returns {number[]} Jours croissants.
     */
    public transform(last_day: number): number[] {
        return Array.from({ length: last_day }, (_: unknown, index: number): number => index + 1);
    }
}
