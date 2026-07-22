import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { debounceTime, Subject } from 'rxjs';

import { HomeEnum } from '../../_abstract_model/enum/home.enum';
import { TownService } from '../../_abstract_model/services/town.service';
import { TownStatisticsService } from '../../_abstract_model/services/town-statistics.service';
import { I18nLabels, Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { EstimationsResult } from '../../_abstract_model/types/estimations-result.class';
import { HomeWithValue } from '../../_abstract_model/types/home.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { getTown } from '../../_core/utilities/localstorage.util';

/** Nombre de paliers d'habitation dans le jeu (niveaux 0 à 8 : Lit de camp → Château). */
const HOUSE_LEVEL_COUNT: number = 9;

/** Délai d'inactivité avant de relancer la simulation, pour ne pas recalculer à chaque frappe. */
const COMPUTE_DEBOUNCE_MS: number = 400;

const angular_common: Imports = [CommonModule, FormsModule];
const pipes: Imports = [DecimalPipe];
const material_modules: Imports = [
    MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSlideToggleModule, MatTooltipModule
];

type DoorState = 'closed' | 'open' | 'open_long';

/** Statistiques agrégées d'un rang (citoyen le plus attaqué = rang 1). */
interface RankStat {
    rank: number;
    mean: number;
    min: number;
    max: number;
    p5: number;
    p95: number;
    death_probability: number;
}

/** Résultat d'un scénario (favorable ou défavorable selon le tirage 45..55). */
interface ScenarioResult {
    label: string;
    factor: number;
    max_active: number;
    attacking: number;
    ranks: RankStat[];
    touched_mean: number;
    touched_min: number;
    touched_max: number;
    deaths_mean: number;
    deaths_min: number;
    deaths_max: number;
    death_at_least_one: number;
}

@Component({
    selector: 'mho-overflow',
    templateUrl: './overflow.component.html',
    styleUrls: ['./overflow.component.scss'],
    imports: [...angular_common, ...material_modules, ...pipes]
})
export class OverflowComponent implements OnInit {

    protected readonly locale: string = moment.locale();
    protected readonly my_town: TownDetails | null = getTown();

    /** Mode « Ma ville » (valeurs pré-remplies et verrouillées) vs « Hors ville » (tout manuel). */
    protected in_town: boolean = !!this.my_town;
    // --- Chaîne d'attaque ---
    /** Attaque estimée (nombre de zombies, après facteur d'âmes rouges). */
    protected attack: number = 500;
    /** Défense totale de la ville (telle qu'affichée en jeu). */
    protected town_defense: number = 300;
    /** État de la porte au moment de l'attaque. */
    protected door_state: DoorState = 'closed';
    /** Défense de veille collective des veilleurs. */
    protected watch_defense: number = 0;
    // --- Contexte ville (pour le facteur de zombies actifs et le ciblage) ---
    /** Jour d'attaque (détermine le nombre de citoyens ciblés). */
    protected day: number = 1;
    /** Nombre de citoyens vivants et présents en ville (cibles potentielles). */
    protected nb_alive: number = 40;
    /** Population de la ville (nombre de places, dénominateur du facteur actif). */
    protected population: number = 40;
    /** Nombre d'habitations par niveau (index = niveau, 0 = Lit de camp ... 8 = Château). */
    protected house_counts: number[] = new Array(HOUSE_LEVEL_COUNT).fill(0);
    /** Libellés des paliers d'habitation, dans la langue courante. */
    protected readonly house_labels: string[] = (HomeEnum.HOUSE_LEVEL.value.house_options ?? [])
        .map((labels: I18nLabels) => (<Record<string, string>><unknown>labels)[this.locale] ?? labels['en']);
    protected chaos: boolean = false;
    protected devastated: boolean = false;
    // --- Répartition / mortalité ---
    /** Défense de maison de référence, pour estimer les morts (mort si zombies > def). */
    protected home_defense: number = 0;
    /** Nombre d'itérations Monte-Carlo. */
    protected iterations: number = 10000;
    /**
     * Mode d'affichage des résultats :
     * - `realistic` : une seule distribution combinant tous les aléas (facteur tiré à chaque itération) ;
     * - `bounds` : deux scénarios encadrants (facteur figé à 45 % et 55 %).
     */
    protected result_mode: 'realistic' | 'bounds' = 'realistic';
    protected overflow_after_watch: number = 0;
    protected targeted_count: number = 0;
    protected factor_min: number = 0;
    protected factor_max: number = 0;
    /** Scénarios calculés : un seul en mode réaliste, deux (favorable/défavorable) en mode bornes. */
    protected scenarios: ScenarioResult[] = [];
    private readonly town_statistics_service: TownStatisticsService = inject(TownStatisticsService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Niveau d'habitation au tercile, dérivé de house_counts (formule du jeu). */
    private habitation_level: number = 0;
    // --- Résultats déterministes ---
    private overflow_after_defense: number = 0;
    /** Demandes de recalcul émises par les champs de saisie, regroupées par {@link COMPUTE_DEBOUNCE_MS}. */
    private readonly compute_request: Subject<void> = new Subject<void>();

    public constructor() {
        this.compute_request
            .pipe(debounceTime(COMPUTE_DEBOUNCE_MS), takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => this.compute());
    }

    public ngOnInit(): void {
        if (this.in_town && this.my_town) {
            this.applyTownValues();
        } else {
            this.compute();
        }
    }

    /** Bascule entre le mode pré-rempli « Ma ville » et le mode manuel « Hors ville ». */
    protected changeInTownMode(): void {
        if (this.in_town && this.my_town) {
            this.applyTownValues();
        } else {
            this.compute();
        }
    }

    /** Demande un recalcul différé : utilisé par les champs saisis au clavier, où chaque frappe est une valeur intermédiaire. */
    protected scheduleCompute(): void {
        this.compute_request.next();
    }

    /** Nombre total d'habitations renseignées (pour vérifier qu'aucune n'est oubliée ou comptée deux fois). */
    protected totalHouses(): number {
        return this.house_counts.reduce((a: number, b: number) => a + b, 0);
    }

    /**
     * Rejoue la chaîne du jeu (NightlyHandler::stage2) :
     * attaque → défenses ville → veilleurs → zombies actifs → répartition dans les maisons.
     */
    protected compute(): void {
        const attack: number = Math.max(0, Math.round(this.attack));
        const door_open: boolean = this.door_state !== 'closed';
        const door_long: boolean = this.door_state === 'open_long';

        // 1. Défenses de la ville : ignorées si la porte est ouverte.
        this.overflow_after_defense = door_open
            ? attack
            : Math.max(0, attack - Math.max(0, this.town_defense));

        // 2. Veilleurs : leur défense de veille collective est soustraite.
        this.overflow_after_watch = Math.max(0, this.overflow_after_defense - Math.max(0, this.watch_defense));

        // 3. Nombre de citoyens ciblés : croît avec le jour, plafonné par la population vivante.
        this.targeted_count = Math.min(
            10 + 2 * Math.floor(Math.max(0, this.day - 10) / 2),
            Math.max(0, Math.ceil(this.nb_alive))
        );

        // 3 bis. Niveau d'habitation au tercile, dérivé du nombre d'habitations par niveau.
        this.habitation_level = this.computeHabitationLevel();

        // 4. Facteur de zombies actifs (base tirée entre 45 et 55 en jeu).
        this.factor_min = this.activeFactor(45, door_open, door_long);
        this.factor_max = this.activeFactor(55, door_open, door_long);

        if (this.result_mode === 'realistic') {
            // Un seul scénario : le facteur est retiré aléatoirement (45–55) à chaque itération.
            this.scenarios = [
                this.runScenario(
                    $localize`Distribution réaliste`,
                    () => this.activeFactor(45 + Math.random() * 10, door_open, door_long),
                    attack
                )
            ];
        } else {
            // Deux scénarios encadrants : facteur figé au minimum (45) et au maximum (55).
            this.scenarios = [
                this.runScenario($localize`Scénario favorable`, () => this.factor_min, attack),
                this.runScenario($localize`Scénario défavorable`, () => this.factor_max, attack)
            ];
        }
    }

    /** Reprend les valeurs connues de la ville courante (jour, chaos, dévastation, attaque estimée et habitations). */
    private applyTownValues(): void {
        const town: TownDetails = <TownDetails>this.my_town;
        this.day = town.day;
        this.chaos = town.is_chaos;
        this.devastated = town.is_devaste;

        this.town_statistics_service.getAttackCalculation(town.day, false)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (result: EstimationsResult) => {
                    if (result?.result?.max) {
                        this.attack = result.result.max;
                    }
                    this.compute();
                },
                error: () => this.compute()
            });

        this.town_service.getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (info: CitizenInfo) => {
                    const counts: number[] = new Array(HOUSE_LEVEL_COUNT).fill(0);
                    for (const citizen of info.citizens) {
                        if (citizen.is_dead) {
                            continue;
                        }
                        const level: number | null = this.houseLevelOf(citizen);
                        if (level !== null && level >= 0 && level < HOUSE_LEVEL_COUNT) {
                            counts[level]++;
                        }
                    }
                    this.house_counts = counts;
                    this.compute();
                },
                error: () => this.compute()
            });
    }

    /** Niveau d'habitation d'un citoyen, extrait de son foyer (null si inconnu). */
    private houseLevelOf(citizen: Citizen): number | null {
        const entry: HomeWithValue | undefined = citizen.home?.content
            ?.find((content: HomeWithValue) => content.element?.key === HomeEnum.HOUSE_LEVEL.key);
        if (!entry) {
            return null;
        }
        return typeof entry.value === 'number' ? entry.value : null;
    }

    /**
     * Facteur de zombies actifs, d'après calculateMaxActiveZombies (BuildingQueryListener).
     * @param base valeur de base tirée aléatoirement entre 45 et 55 en jeu
     */
    private activeFactor(base: number, door_open: boolean, door_long: boolean): number {
        const door_bonus: number = !door_open ? 0 : door_long ? 25 : 10;
        const population: number = Math.max(1, this.population);
        const citizen_factor: number = (Math.max(15, this.nb_alive) + Math.max(0, this.habitation_level) * 2) / population;
        const extra: number = (this.chaos ? 10 : 0) + (this.devastated ? 10 : 0);
        const level: number = (base + door_bonus) * citizen_factor + extra;
        return Math.max(0, Math.min(level / 100, 1));
    }

    /**
     * Niveau d'habitation retenu pour le facteur de zombies actifs, d'après calculateMaxActiveZombies :
     * plus haut niveau atteint par au moins un tiers des citoyens (tercile) ; à défaut, le plus haut niveau présent.
     */
    private computeHabitationLevel(): number {
        const total: number = this.totalHouses();
        if (total <= 0) {
            return 0;
        }
        const threshold: number = Math.ceil(total / 3);

        let highest_present: number = 0;
        let tercile: number = 0;
        let at_least: number = total; // nombre de citoyens de niveau >= au niveau courant
        for (let level: number = 0; level < this.house_counts.length; level++) {
            if (this.house_counts[level] > 0) {
                highest_present = level;
            }
            if (at_least >= threshold) {
                tercile = level;
            }
            at_least -= this.house_counts[level];
        }
        return tercile > 0 ? tercile : highest_present;
    }

    /**
     * @param sampleFactor renvoie le facteur de zombies actifs pour une itération
     *        (constant en mode bornes, retiré aléatoirement en mode réaliste)
     */
    private runScenario(label: string, sampleFactor: () => number, attack: number): ScenarioResult {
        const n: number = this.targeted_count;
        const iterations: number = Math.max(100, Math.round(this.iterations));
        const threshold: number = Math.max(0, this.home_defense);

        if (this.overflow_after_watch <= 0 || n <= 0) {
            return {
                label, factor: 0, max_active: 0, attacking: 0, ranks: [],
                touched_mean: 0, touched_min: 0, touched_max: 0,
                deaths_mean: 0, deaths_min: 0, deaths_max: 0, death_at_least_one: 0
            };
        }

        // Valeurs par rang, sur toutes les itérations (rang manquant = 0 zombie reçu).
        const rank_values: number[][] = Array.from({ length: n }, () => []);
        const touched: number[] = [];
        const deaths: number[] = [];
        const attackings: number[] = [];
        let factor_sum: number = 0;
        let at_least_one_death: number = 0;

        for (let iter: number = 0; iter < iterations; iter++) {
            const factor: number = sampleFactor();
            const attacking: number = Math.min(Math.round(attack * factor), this.overflow_after_watch);
            factor_sum += factor;
            attackings.push(attacking);

            const distribution: number[] = attacking > 0 ? this.distribute(attacking, n) : [];

            touched.push(distribution.length);

            let dead: number = 0;
            for (let r: number = 0; r < n; r++) {
                const value: number = r < distribution.length ? distribution[r] : 0;
                rank_values[r].push(value);
                if (value > threshold) {
                    dead++;
                }
            }
            deaths.push(dead);
            if (dead > 0) {
                at_least_one_death++;
            }
        }

        const ranks: RankStat[] = rank_values.map((values: number[], index: number) => {
            values.sort((a: number, b: number) => a - b);
            const mean: number = values.reduce((a: number, b: number) => a + b, 0) / values.length;
            const above: number = values.filter((v: number) => v > threshold).length;
            return {
                rank: index + 1,
                mean,
                min: values[0],
                max: values[values.length - 1],
                p5: this.percentile(values, 5),
                p95: this.percentile(values, 95),
                death_probability: above / values.length
            };
        });

        const factor: number = factor_sum / iterations;
        return {
            label, factor, max_active: Math.round(attack * factor), attacking: Math.round(this.mean(attackings)), ranks,
            touched_mean: this.mean(touched),
            touched_min: Math.min(...touched),
            touched_max: Math.max(...touched),
            deaths_mean: this.mean(deaths),
            deaths_min: Math.min(...deaths),
            deaths_max: Math.max(...deaths),
            death_at_least_one: at_least_one_death / iterations
        };
    }

    /**
     * Répartition d'`attacking` zombies entre `n` citoyens, fidèle à l'algorithme du jeu :
     * poids aléatoires, un citoyen « malchanceux » (+0,3), normalisation puis distribution
     * du reliquat, retrait des citoyens à 0, tri décroissant.
     */
    private distribute(attacking: number, n: number): number[] {
        const rep: number[] = Array.from({ length: n }, () => Math.random());
        rep[Math.floor(Math.random() * n)] += 0.3;

        const sum: number = rep.reduce((a: number, b: number) => a + b, 0);

        let remaining: number = attacking;
        for (let i: number = 0; i < n; i++) {
            const value: number = Math.max(0, Math.min(remaining, Math.round((rep[i] / sum) * attacking)));
            rep[i] = value;
            remaining -= value;
        }
        while (remaining > 0) {
            rep[Math.floor(Math.random() * n)] += 1;
            remaining--;
        }

        return rep.filter((v: number) => v > 0).sort((a: number, b: number) => b - a);
    }

    private percentile(sorted_ascending: number[], p: number): number {
        if (sorted_ascending.length === 0) return 0;
        const index: number = Math.min(
            sorted_ascending.length - 1,
            Math.max(0, Math.round((p / 100) * (sorted_ascending.length - 1)))
        );
        return sorted_ascending[index];
    }

    private mean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((a: number, b: number) => a + b, 0) / values.length;
    }
}
