import { CommonModule, DecimalPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { Imports } from '../../_abstract_model/types/_types';

/** Borne haute de la saisie, reprise de l'attribut `max` du gabarit. */
const MAX_PEOPLE: number = 40;

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [DecimalPipe];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-probabilities',
    templateUrl: './probabilities.component.html',
    styleUrls: ['./probabilities.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProbabilitiesComponent implements AfterViewInit {

    /** Signal : {@link ngAfterViewInit} s'exécute APRÈS la première évaluation du template
     *  (executeTemplate précède les hooks de vue) — sans signal, la simulation initiale calculée
     *  là resterait invisible sous OnPush (aucun événement ne marque la vue à revérifier). */
    protected readonly simulations: WritableSignal<Simulation[]> = signal([
        { current_chances: [0], result_probabilities: [], title: $localize`Simulation 1`, editing_title: false, show_detail: true }
    ]);

    protected default_value: number = 0;
    protected readonly locale: string = moment.locale();

    public ngAfterViewInit(): void {
        this.simulations().forEach((simulation: Simulation): void => {
            this.calculateProbabilities(simulation);
        });
        // Nouvelle référence de tableau pour notifier : les simulations elles-mêmes sont mutées en
        // place ci-dessus, seul le sommet (le tableau) doit changer pour que le signal se déclenche.
        this.simulations.set([...this.simulations()]);
    }

    protected createSimulation(): void {
        const new_simulation: Simulation = {
            current_chances: [0],
            result_probabilities: [],
            title: $localize`Simulation` + ' ' + (this.simulations().length + 1),
            editing_title: false,
            show_detail: true
        };
        this.simulations.set([...this.simulations(), new_simulation]);
        this.calculateProbabilities(new_simulation);
    }

    /**
     * Ajoute une personne, à la valeur par défaut. C'est le seul moyen d'en ajouter : le champ
     * « nombre de personnes » qui vivait à côté faisait la même chose par un autre bout, et
     * n'offrait de retirer quelqu'un que par la fin de la liste — jamais celui qu'on visait.
     */
    protected addPerson(simulation: Simulation): void {
        if (simulation.current_chances.length >= MAX_PEOPLE) return;
        simulation.current_chances = [...simulation.current_chances, this.default_value];
        this.calculateProbabilities(simulation);
        this.simulations.set([...this.simulations()]);
    }

    /** Retire la personne visée. La dernière reste : une simulation sans personne ne dit rien. */
    protected removePerson(simulation: Simulation, index: number): void {
        if (simulation.current_chances.length <= 1) return;
        simulation.current_chances = simulation.current_chances.filter((_chance: number, i: number): boolean => i !== index);
        this.calculateProbabilities(simulation);
        this.simulations.set([...this.simulations()]);
    }

    /** Hauteur d'une barre de l'histogramme, rapportée à l'issue la plus probable. Un plancher
     *  de 2 % garde visibles les issues quasi impossibles : leur absence se lirait comme un zéro. */
    protected barHeight(probability: number, peak: number | undefined): number {
        if (!peak) return 0;
        return Math.max(2, Math.round(probability / peak * 100));
    }

    protected deleteSimulation(index: number): void {
        this.simulations.set(this.simulations().filter((_: Simulation, i: number) => i !== index));
    }

    protected calculateProbabilities(simulation: Simulation): void {
        if (!simulation.current_chances) {
            simulation.result_probabilities = [];
        } else {
            const death_probabilities: number[] = simulation.current_chances.map((value: number) => (100 - +value) / 100);
            const nb_watchers: number = death_probabilities.length;
            const result_map: number[][] = new Array(nb_watchers + 1);
            let nb_deaths: number = 0;
            let previous_watchers: number = 0;

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
            const results: number[] = new Array(nb_watchers + 1);

            for (let i: number = 0; i <= nb_watchers; i++) {
                results[i] = result_map[i][nb_watchers];
            }

            simulation.result_probabilities = results;
        }

        this.calculateSummary(simulation);
    }

    /**
     * Moyenne, issue la plus probable et poids de cette issue. Les trois se calculent en une
     * passe, au moment du calcul : les demander depuis le gabarit reviendrait à parcourir la
     * distribution une fois par barre d'histogramme.
     */
    private calculateSummary(simulation: Simulation): void {
        const outcomes: number = simulation.result_probabilities.length;

        let average: number = 0;
        let most_likely: number = 0;
        for (let i: number = 0; i < outcomes; i++) {
            average = average + i * simulation.result_probabilities[i];
            if (simulation.result_probabilities[i] > simulation.result_probabilities[most_likely]) {
                most_likely = i;
            }
        }

        simulation.result_average = average;
        simulation.result_most_likely = outcomes > 0 ? most_likely : undefined;
        simulation.result_peak = outcomes > 0 ? simulation.result_probabilities[most_likely] : undefined;
    }
}

interface Simulation {
    /** Une entrée par personne : sa chance de survie en %. Sa longueur EST le nombre de personnes. */
    current_chances: number[];
    result_probabilities: number[];
    result_average?: number;
    /** Nombre de morts le plus probable, et le poids de cette issue : ce que le tableau ne dit
     *  pas d'un coup d'œil. */
    result_most_likely?: number;
    result_peak?: number;
    title: string;
    editing_title: boolean;
    show_detail: boolean;
}
