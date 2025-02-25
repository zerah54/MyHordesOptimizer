import { CommonModule, DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, HostBinding, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [DecimalPipe];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-probabilities',
    templateUrl: './probabilities.component.html',
    styleUrls: ['./probabilities.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ProbabilitiesComponent implements AfterViewInit {
    @HostBinding('style.display') display: string = 'contents';

    public simulations: Simulation[] = [
        {nb_people: 1, current_chances: [0], result_probabilities: [], title: $localize`Simulation 1`, editing_title: false, show_detail: true}
    ];

    public default_value: number = 0;
    public readonly locale: string = moment.locale();

    public ngAfterViewInit(): void {
        this.simulations.forEach((simulation: Simulation) => {
            this.convertFieldsToChances(simulation);
        });
    }

    public createSimulation(): void {
        const new_simulation: Simulation = {
            nb_people: 1,
            current_chances: [0],
            result_probabilities: [],
            title: $localize`Simulation` + ' ' + (this.simulations.length + 1),
            editing_title: false,
            show_detail: true
        };
        this.simulations.push(new_simulation);
        this.calculateProbabilities(new_simulation);
    }

    public deleteSimulation(index: number): void {
        this.simulations.splice(index, 1);
    }

    public convertFieldsToChances(simulation: Simulation): void {
        if (simulation.current_chances.length > simulation.nb_people) {
            simulation.current_chances = simulation.current_chances.slice(0, simulation.nb_people);
        } else if (simulation.current_chances.length < simulation.nb_people) {
            const add_chances: number[] = new Array(simulation.nb_people - simulation.current_chances.length).fill(this.default_value);
            simulation.current_chances = simulation.current_chances.concat(add_chances);
        }
        this.calculateProbabilities(simulation);
    }

    public calculateProbabilities(simulation: Simulation): void {
        if (!simulation.current_chances) {
            simulation.result_probabilities = [];
        } else {
            const death_probabilities: number[] = simulation.current_chances.map((value: number) => (100 - +value) / 100);
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

            simulation.result_probabilities = results;
        }

        this.calculateAverage(simulation);
    }

    private calculateAverage(simulation: Simulation): void {
        let average: number;
        const nb_watchers: number = simulation.result_probabilities.length;

        average = 0;
        for (let i: number = 0; i < nb_watchers; i++) {
            average = average + i * simulation.result_probabilities[i];
        }
        simulation.result_average = average;
    }
}

interface Simulation {
    nb_people: number;
    current_chances: number[];
    result_probabilities: number[];
    result_average?: number;
    title: string;
    editing_title: boolean;
    show_detail: boolean;
}
