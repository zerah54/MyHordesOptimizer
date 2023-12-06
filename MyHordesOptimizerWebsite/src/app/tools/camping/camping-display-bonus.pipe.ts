import { formatNumber } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'campingDisplayBonus',
    standalone: true,
})
export class CampingDisplayBonusPipe implements PipeTransform {

    transform(bonus: number, bonus_by_ap: boolean, locale: string): string {
        return formatNumber(bonus_by_ap ? (bonus / 5) : bonus, locale, '1.0-2') + (bonus_by_ap ? '' : '%');
    }
}
