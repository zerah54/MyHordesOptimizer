

import { Pipe, PipeTransform, QueryList } from '@angular/core';
import { MatInput } from '@angular/material/input';


@Pipe({
    name: 'probabilities',
})
export class ProbabilitiesPipe implements PipeTransform {
    transform(values: number[]): number[] {

        if (!values) return [];

        const death_probabilities: number[] = values.map((value: number) => (100 - +value) / 100);
        const nb_watchers: number = death_probabilities.length;
        const result_map: number[][] = new Array(nb_watchers + 1);
        var nb_deaths: number = 0;
        var previous_watchers = 0;
        var results: number[] = [];

        for (let i = 0; i <= nb_watchers; i++) {
            result_map[i] = new Array(nb_watchers + 1).fill(0);
        }

        result_map[nb_deaths][previous_watchers] = 1;
        previous_watchers++;
        while (previous_watchers <= nb_watchers) {
            result_map[nb_deaths][previous_watchers] = result_map[nb_deaths][previous_watchers - 1] * (1 - death_probabilities[previous_watchers - 1]);
            previous_watchers++;
        }

        nb_deaths++;
        while (nb_deaths <= nb_watchers) {
            previous_watchers = nb_deaths;
            result_map[nb_deaths][previous_watchers] = result_map[nb_deaths - 1][previous_watchers - 1] * death_probabilities[previous_watchers - 1];
            previous_watchers++;

            while (previous_watchers <= nb_watchers) {
                result_map[nb_deaths][previous_watchers] = result_map[nb_deaths][previous_watchers - 1] * (1 - death_probabilities[previous_watchers - 1])
                    + result_map[nb_deaths - 1][previous_watchers - 1] * death_probabilities[previous_watchers - 1];

                    previous_watchers++;
            }
            nb_deaths++;
        }
        results = new Array(nb_watchers + 1);

        for (let i = 0; i <= nb_watchers; i++) {
            results[i] = result_map[i][nb_watchers];
        }

        return results;
    }
}


