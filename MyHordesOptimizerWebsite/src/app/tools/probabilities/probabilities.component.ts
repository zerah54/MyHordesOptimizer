import { CommonModule, DecimalPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import moment from 'moment';

import { Imports } from '../../_abstract_model/types/_types';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { decodeSnapshot, toBoundedNumber, TOOL_SNAPSHOT_PARAM } from '../../_core/utilities/tool-snapshot.util';
import { ToolPresetsComponent } from '../../_shared/tool-presets/tool-presets.component';

/** Borne haute de la saisie, reprise de l'attribut `max` du gabarit. */
const MAX_PEOPLE: number = 40;

/** Version du format de snapshot ; un snapshot d'une autre version est refusé. */
const SNAPSHOT_VERSION: number = 1;

/** Bornes d'un snapshot : il vient d'un lien ou d'un preset, donc d'ailleurs que de la saisie. */
const SNAPSHOT_MAX_SIMULATIONS: number = 20;
const SNAPSHOT_MAX_TITLE_LENGTH: number = 60;

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [ToolPresetsComponent];
const pipes: Imports = [DecimalPipe];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-probabilities',
    templateUrl: './probabilities.component.html',
    styleUrls: ['./probabilities.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProbabilitiesComponent implements OnInit, AfterViewInit {

    /** Signal : {@link ngAfterViewInit} s'exécute APRÈS la première évaluation du template
     *  (executeTemplate précède les hooks de vue) — sans signal, la simulation initiale calculée
     *  là resterait invisible sous OnPush (aucun événement ne marque la vue à revérifier). */
    protected readonly simulations: WritableSignal<Simulation[]> = signal([
        { current_chances: [0], result_probabilities: [], title: $localize`Simulation 1`, editing_title: false, show_detail: true }
    ]);

    protected default_value: number = 0;
    protected readonly locale: string = moment.locale();

    /** Fournit {@link toSnapshot} au menu de presets, qui l'appelle à la demande (copie du lien, enregistrement). */
    protected readonly snapshot_provider: () => Record<string, unknown> = (): Record<string, unknown> => this.toSnapshot();

    private readonly router: Router = inject(Router);
    private readonly snackbar_service: SnackbarService = inject(SnackbarService);

    public ngOnInit(): void {
        const shared: string | null = this.router.routerState.snapshot.root.queryParamMap.get(TOOL_SNAPSHOT_PARAM);
        if (shared !== null) {
            this.loadSnapshot(decodeSnapshot(shared));
        }
    }

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
            title: this.defaultTitle(this.simulations().length),
            editing_title: false,
            show_detail: true
        };
        this.simulations.set([...this.simulations(), new_simulation]);
        this.calculateProbabilities(new_simulation);
    }

    /** Configuration de la page, réduite aux saisies (titre et chances) : de quoi la rejouer via un lien ou un preset. */
    protected toSnapshot(): Record<string, unknown> {
        return {
            v: SNAPSHOT_VERSION,
            simulations: this.simulations().map((simulation: Simulation) => ({ title: simulation.title, chances: [...simulation.current_chances] }))
        };
    }

    /**
     * Remplace les simulations par celles du snapshot. Le snapshot est une entrée non fiable : tout est borné,
     * une simulation sans chances est écartée.
     * @returns `false` (état intact) si la version n'est pas reconnue ou si aucune simulation n'est exploitable
     */
    protected applySnapshot(raw: Record<string, unknown>): boolean {
        const entries: unknown = raw['simulations'];
        if (raw['v'] !== SNAPSHOT_VERSION || !Array.isArray(entries)) {
            return false;
        }
        const simulations: Simulation[] = entries
            .slice(0, SNAPSHOT_MAX_SIMULATIONS)
            .map((entry: unknown): ParsedSimulation | null => this.parseSimulation(entry))
            .filter((entry: ParsedSimulation | null): entry is ParsedSimulation => entry !== null)
            .map((entry: ParsedSimulation, index: number): Simulation => ({
                current_chances: entry.chances,
                result_probabilities: [],
                title: entry.title ?? this.defaultTitle(index),
                editing_title: false,
                show_detail: true
            }));
        if (simulations.length === 0) {
            return false;
        }
        simulations.forEach((simulation: Simulation): void => this.calculateProbabilities(simulation));
        this.simulations.set(simulations);
        return true;
    }

    /** Applique un snapshot venu d'un lien ou d'un preset, et avertit l'utilisateur s'il est illisible ou inexploitable. */
    protected loadSnapshot(raw: Record<string, unknown> | null): boolean {
        const applied: boolean = raw !== null && this.applySnapshot(raw);
        if (!applied) {
            this.snackbar_service.warningSnackbar($localize`Configuration illisible ou d'une version incompatible.`);
        }
        return applied;
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

    /** Titre d'une simulation créée sans nom, d'après sa position (0 = première). */
    private defaultTitle(position: number): string {
        return $localize`Simulation` + ' ' + (position + 1);
    }

    /** Saisies d'une simulation d'un snapshot, ou `null` si elle n'a aucune chance exploitable. */
    private parseSimulation(entry: unknown): ParsedSimulation | null {
        if (typeof entry !== 'object' || entry === null) {
            return null;
        }
        const title: unknown = (<Record<string, unknown>>entry)['title'];
        const chances: unknown = (<Record<string, unknown>>entry)['chances'];
        if (!Array.isArray(chances) || chances.length === 0) {
            return null;
        }
        return {
            title: typeof title === 'string' && title.trim() !== '' ? title.slice(0, SNAPSHOT_MAX_TITLE_LENGTH) : null,
            chances: chances.slice(0, MAX_PEOPLE).map((chance: unknown): number => toBoundedNumber(chance, 0, 100, 0))
        };
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

/** Saisies d'une simulation lues dans un snapshot ; `title` vaut `null` quand le snapshot n'en donne pas d'exploitable. */
interface ParsedSimulation {
    title: string | null;
    chances: number[];
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
