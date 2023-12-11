import { Pipe, PipeTransform } from '@angular/core';
import { Misc } from '../../_abstract_model/interfaces';
import { TownDetails } from '../../_abstract_model/types/town-details.class';


@Pipe({
    name: 'despairDeaths',
    standalone: true,
})
export class DespairDeathsPipe implements PipeTransform {
    transform(nb_killed_zombies: number): number {
        return Math.floor(Math.max(0, (nb_killed_zombies - 1) / 2));
    }
}

@Pipe({
    name: 'isTodayMiscRow',
    standalone: true,
})
export class IsTodayMiscRowPipe implements PipeTransform {
    transform(row: Record<string, string>, table: Misc, town: TownDetails | null): boolean {
        const has_town: boolean = town !== undefined && town !== null;
        const row_has_day: boolean = row['day'] !== undefined && row['day'] !== null;
        return (has_town && table.highlight_day && row_has_day && parseInt(row['day']) === town?.day) ?? false;
    }
}
