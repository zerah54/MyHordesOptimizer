import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'despairDeaths',
})
export class DespairDeathsPipe implements PipeTransform {
    transform(nb_killed_zombies: number): number {
        return Math.floor(Math.max(0, (nb_killed_zombies - 1) / 2));
    }
}
