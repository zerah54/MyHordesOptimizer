import { AfterViewInit, Component, HostBinding, QueryList, ViewChildren } from '@angular/core';
import { MatInput } from '@angular/material/input';
import * as moment from 'moment';

@Component({
    selector: 'mho-probabilities',
    templateUrl: './probabilities.component.html',
    styleUrls: ['./probabilities.component.scss']
})
export class ProbabilitiesComponent implements AfterViewInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChildren('chances', {read: MatInput}) chances!: QueryList<MatInput>;

    public nb_people: number = 1;
    public current_chances: number[] = [];
    public result_probabilities: number[] = [];
    public result_average!: number;

    public readonly locale: string = moment.locale();

    public ngAfterViewInit(): void {
        this.convertFieldsToChances();
    }

    updateValues(): void {
        setTimeout(() => {
            this.convertFieldsToChances();
        });
    }

    private convertFieldsToChances(): void {
        this.current_chances = [...Array.from(this.chances || [])
            .filter((chance: MatInput) => chance.value !== null && chance.value !== undefined && chance.value !== '')
            .map((chance: MatInput) => +chance.value)];

        this.calculateProbabilities();
    }

    private calculateProbabilities(): void {

        if (!this.current_chances) {
            this.result_probabilities = [];
        } else {

            const death_probabilities: number[] = this.current_chances.map((value: number) => (100 - +value) / 100);
            const nb_watchers: number = death_probabilities.length;
            const result_map: number[][] = new Array(nb_watchers + 1);
            let nb_deaths: number = 0;
            let previous_watchers: number = 0;
            let results: number[] = [];

            for (let i: number = 0; i <= nb_watchers; i++) {
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

            for (let i: number = 0; i <= nb_watchers; i++) {
                results[i] = result_map[i][nb_watchers];
            }

            this.result_probabilities = results;
        }
        this.calculateAverage();
    }

    private calculateAverage(): void {
        let average: number;
        const nb_watchers: number = this.result_probabilities.length;

        average = 0;
        for (let i: number = 0; i < nb_watchers; i++) {
            average = average + i * this.result_probabilities[i];
        }
        this.result_average = average * 100;
    }
}
