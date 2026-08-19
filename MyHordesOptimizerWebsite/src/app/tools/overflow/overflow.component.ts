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
import { catchError, debounceTime, forkJoin, of, Subject, take } from 'rxjs';

import { HomeEnum } from '../../_abstract_model/enum/home.enum';
import { TownService } from '../../_abstract_model/services/town.service';
import { TownStatisticsService } from '../../_abstract_model/services/town-statistics.service';
import { I18nLabels, Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { EstimationsResult } from '../../_abstract_model/types/estimations-result.class';
import { HomeWithValue } from '../../_abstract_model/types/home.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { computeReconstructedHomeDefense } from '../../_abstract_model/utils/citizen-home-defense.util';
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

/** Ligne éditable de défense personnelle, une par citoyen ciblable. */
interface CitizenDefenseRow {
    label: string;
    /** Vrai si {@link label} est un nom réel (mode « Ma ville »), faux si c'est un libellé générique. */
    named: boolean;
    defense: number;
}

/** Statistiques agrégées d'un citoyen nommé (identité réelle, contrairement au rang). */
interface CitizenStat {
    label: string;
    named: boolean;
    defense: number;
    mean: number;
    death_probability: number;
}

/** Statistiques agrégées de tous les citoyens ciblables partageant la même défense. */
interface DefenseGroupStat {
    defense: number;
    count: number;
    mean: number;
    death_probability: number;
    /** Noms des citoyens nommés du groupe (mode « Ma ville »), vide si aucun (pas d'infobulle dans ce cas). */
    names: string[];
}

/** Probabilité d'obtenir exactement / au moins `deaths` morts sur l'ensemble des citoyens ciblés. */
interface DeathHistogramEntry {
    deaths: number;
    probability: number;
    at_least_probability: number;
}

/** Miroir de {@link DeathHistogramEntry} : probabilité d'obtenir exactement / au moins `survivors` survivants. */
interface SurvivorHistogramEntry {
    survivors: number;
    probability: number;
    at_least_probability: number;
}

/** Résultat d'un scénario (favorable ou défavorable selon le tirage 45..55). */
export interface ScenarioResult {
    label: string;
    factor: number;
    max_active: number;
    attacking: number;
    ranks: RankStat[];
    citizens: CitizenStat[];
    defense_groups: DefenseGroupStat[];
    death_histogram: DeathHistogramEntry[];
    survivor_histogram: SurvivorHistogramEntry[];
    touched_mean: number;
    touched_min: number;
    touched_max: number;
    deaths_mean: number;
    deaths_min: number;
    deaths_max: number;
    death_at_least_one: number;
    survivor_at_least_one: number;
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
    /** Défense de maison par défaut, mort si zombies > def. Sert aussi à pré-remplir {@link citizen_defenses}. */
    protected home_defense: number = 0;
    /** Nombre d'itérations Monte-Carlo. */
    protected iterations: number = 10000;
    /** Affichage de la répartition finale : nombre de morts ou de survivants (même distribution, lue dans l'autre sens). */
    protected histogram_view: 'deaths' | 'survivors' = 'deaths';
    protected overflow_after_watch: number = 0;
    protected targeted_count: number = 0;
    protected factor_min: number = 0;
    protected factor_max: number = 0;
    /** Nombre de zombies actifs (bornes), déduit du facteur et plafonné par le débordement. */
    protected active_zombies_min: number = 0;
    protected active_zombies_max: number = 0;
    /** Vrai si le débordement plafonne déjà l'attaque au minimum du facteur : favorable et défavorable sont alors identiques. */
    protected bounds_saturated: boolean = false;
    /** Défense personnelle éditable par citoyen ciblable, pré-remplie avec {@link home_defense}. */
    protected citizen_defenses: CitizenDefenseRow[] = [];
    /** Scénario détaillé (facteur retiré à chaque itération), affiché avec le détail complet (rangs, citoyens, histogramme). */
    protected scenarios: ScenarioResult[] = [];
    /** Bornes encadrantes (facteur figé à 45 % / 55 %), affichées en complément du réaliste sans onglet séparé. */
    protected favorable: ScenarioResult | null = null;
    protected defavorable: ScenarioResult | null = null;
    private readonly town_statistics_service: TownStatisticsService = inject(TownStatisticsService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Niveau d'habitation au tercile, dérivé de house_counts (formule du jeu). */
    private habitation_level: number = 0;
    /** Citoyens vivants connus (mode « Ma ville »), pour étiqueter et pré-remplir {@link citizen_defenses}. */
    private known_citizens: Citizen[] = [];
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

    /** La dévastation implique toujours le chaos en jeu (TownHandler::devastateTown coche les deux ensemble) : les cases sont donc liées. */
    protected changeDevastated(): void {
        if (this.devastated) {
            this.chaos = true;
        }
        this.compute();
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
        // La dévastation force la porte ouverte (TownHandler::devastateTown) ; passé la nuit même,
        // elle est toujours ouverte depuis plus de 30 min (aucun code ne la referme jamais).
        const door_open: boolean = this.devastated || this.door_state !== 'closed';
        const door_long: boolean = this.devastated || this.door_state === 'open_long';

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

        // 3 bis. Niveau d'habitation au tercile. La dévastation ramène tous les logements au niveau 0
        // (CitizenHomePrototype lv0 = défense 0), donc le tercile aussi.
        this.habitation_level = this.devastated ? 0 : this.computeHabitationLevel();

        // 3 ter. Lignes de défense personnelle, une par citoyen ciblable.
        this.syncCitizenDefenses();

        // 4. Facteur de zombies actifs (base tirée entre 45 et 55 en jeu).
        this.factor_min = this.activeFactor(45, door_open, door_long);
        this.factor_max = this.activeFactor(55, door_open, door_long);
        this.active_zombies_min = Math.min(Math.round(attack * this.factor_min), this.overflow_after_watch);
        this.active_zombies_max = Math.min(Math.round(attack * this.factor_max), this.overflow_after_watch);
        // Si le minimum atteint déjà le débordement, le maximum aussi (monotone) : le facteur ne change plus rien,
        // favorable/défavorable/réaliste finissent avec la même attaque servie.
        this.bounds_saturated = this.active_zombies_min >= this.overflow_after_watch;

        // Scénario détaillé : le facteur est retiré aléatoirement (45–55, un entier comme mt_rand en jeu) à chaque itération.
        this.scenarios = [
            this.runScenario(
                $localize`Distribution réaliste`,
                () => this.activeFactor(this.drawFactorBase(), door_open, door_long),
                attack
            )
        ];
        // Bornes encadrantes : facteur figé au minimum (45) et au maximum (55), calculées à côté (pas de bascule).
        this.favorable = this.runScenario($localize`Scénario favorable`, () => this.factor_min, attack);
        this.defavorable = this.runScenario($localize`Scénario défavorable`, () => this.factor_max, attack);
    }

    /** Détail du facteur de zombies actifs (% de l'attaque et % du débordement réellement servi), pour affichage au survol. */
    protected activeZombiesTooltip(): string {
        const overflow_min: number = this.overflow_after_watch > 0 ? this.active_zombies_min / this.overflow_after_watch : 0;
        const overflow_max: number = this.overflow_after_watch > 0 ? this.active_zombies_max / this.overflow_after_watch : 0;
        return $localize`${this.formatPercent(this.factor_min)} – ${this.formatPercent(this.factor_max)} de l'attaque
${this.formatPercent(overflow_min)} – ${this.formatPercent(overflow_max)} du débordement`;
    }

    private formatPercent(ratio: number): string {
        return `${Math.round(ratio * 1000) / 10}%`;
    }

    /** Reprend les valeurs connues de la ville courante (jour, chaos, dévastation, attaque estimée et habitations). */
    private applyTownValues(): void {
        const town: TownDetails = <TownDetails>this.my_town;
        this.day = town.day;
        this.chaos = town.is_chaos;
        this.devastated = town.is_devaste;

        // Un seul compute() une fois les deux réponses arrivées : sinon la première à résoudre
        // pré-remplit citizen_defenses (noms/défenses) avant que les données réelles soient là.
        forkJoin({
            attack: this.town_statistics_service.getAttackCalculation(town.day, false)
                .pipe(take(1), catchError(() => of(null))),
            citizens: this.town_service.getCitizens()
                .pipe(take(1), catchError(() => of(null)))
        })
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(({ attack, citizens: citizensInfo }: { attack: EstimationsResult | null; citizens: CitizenInfo | null }) => {
                if (attack?.result?.max) {
                    this.attack = attack.result.max;
                }
                if (citizensInfo) {
                    const counts: number[] = new Array(HOUSE_LEVEL_COUNT).fill(0);
                    const citizens: Citizen[] = [];
                    for (const citizen of citizensInfo.citizens) {
                        if (citizen.is_dead) {
                            continue;
                        }
                        citizens.push(citizen);
                        const level: number | null = this.houseLevelOf(citizen);
                        if (level !== null && level >= 0 && level < HOUSE_LEVEL_COUNT) {
                            counts[level]++;
                        }
                    }
                    this.house_counts = counts;
                    this.known_citizens = citizens;
                    this.nb_alive = citizens.length;
                }
                this.compute();
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

    /** Tirage de la base du facteur de zombies actifs : un entier 45–55, comme mt_rand(45, 55) en jeu. */
    private drawFactorBase(): number {
        return 45 + Math.floor(Math.random() * 11);
    }

    /**
     * Ajuste {@link citizen_defenses} au nombre de citoyens vivants : conserve les défenses déjà saisies,
     * complète avec le nom réel (mode « Ma ville ») ou générique et la défense par défaut ({@link home_defense}).
     */
    private syncCitizenDefenses(): void {
        const count: number = Math.max(0, Math.ceil(this.nb_alive));
        if (this.citizen_defenses.length > count) {
            this.citizen_defenses = this.citizen_defenses.slice(0, count);
        } else if (this.citizen_defenses.length < count) {
            const additions: CitizenDefenseRow[] = [];
            for (let i: number = this.citizen_defenses.length; i < count; i++) {
                additions.push({
                    label: this.known_citizens[i]?.name ?? $localize`Citoyen ${i + 1}`,
                    named: !!this.known_citizens[i],
                    defense: this.known_citizens[i] ? computeReconstructedHomeDefense(this.known_citizens[i]) : this.home_defense
                });
            }
            this.citizen_defenses = this.citizen_defenses.concat(additions);
        }
        // Le libellé n'est jamais saisi par l'utilisateur : on le réaligne toujours sur le nom connu.
        this.citizen_defenses = this.citizen_defenses.map((row: CitizenDefenseRow, i: number) => {
            const known_name: string | undefined = this.known_citizens[i]?.name;
            return known_name ? { ...row, label: known_name, named: true } : { ...row, named: false };
        });
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
        const pool_size: number = this.citizen_defenses.length;
        const iterations: number = Math.max(100, Math.round(this.iterations));
        const citizen_thresholds: number[] = this.citizen_defenses.map((row: CitizenDefenseRow) => Math.max(0, row.defense));

        if (this.overflow_after_watch <= 0 || n <= 0 || pool_size <= 0) {
            return {
                label, factor: 0, max_active: 0, attacking: 0, ranks: [], citizens: [], defense_groups: [],
                death_histogram: [], survivor_histogram: [],
                touched_mean: 0, touched_min: 0, touched_max: 0,
                deaths_mean: 0, deaths_min: 0, deaths_max: 0, death_at_least_one: 0, survivor_at_least_one: 0
            };
        }

        // Valeurs par rang, sur toutes les itérations (rang manquant = 0 zombie reçu).
        const rank_values: number[][] = Array.from({ length: n }, () => []);
        // Valeurs par citoyen nommé : 0 les itérations où il n'est pas tiré parmi les ciblés.
        const citizen_values: number[][] = Array.from({ length: pool_size }, () => []);
        const citizen_death_count: number[] = new Array(pool_size).fill(0);
        const rank_death_count: number[] = new Array(n).fill(0);
        const death_counts: number[] = new Array(n + 1).fill(0);
        const touched: number[] = [];
        const deaths: number[] = [];
        const attackings: number[] = [];
        let factor_sum: number = 0;
        let at_least_one_death: number = 0;
        let at_least_one_survivor: number = 0;

        for (let iter: number = 0; iter < iterations; iter++) {
            const factor: number = sampleFactor();
            const attacking: number = Math.min(Math.round(attack * factor), this.overflow_after_watch);
            factor_sum += factor;
            attackings.push(attacking);

            // Identité réelle des citoyens ciblés cette itération (tirage sans remise, comme random->pick en jeu).
            const chosen: number[] = this.pickTargets(pool_size, n);
            const raw: number[] = attacking > 0 ? this.distribute(attacking, n) : new Array(n).fill(0);

            // Chaque rang porte la défense du citoyen réellement tiré, pas une défense par défaut.
            const paired: { value: number; threshold: number }[] = raw
                .map((value: number, slot: number) => ({ value, threshold: citizen_thresholds[chosen[slot]] }))
                .filter((entry: { value: number; threshold: number }) => entry.value > 0)
                .sort((a: { value: number }, b: { value: number }) => b.value - a.value);

            touched.push(paired.length);

            let dead: number = 0;
            for (let r: number = 0; r < n; r++) {
                const value: number = r < paired.length ? paired[r].value : 0;
                rank_values[r].push(value);
                if (r < paired.length && paired[r].value > paired[r].threshold) {
                    dead++;
                    rank_death_count[r]++;
                }
            }
            deaths.push(dead);
            death_counts[dead]++;
            if (dead > 0) {
                at_least_one_death++;
            }
            if (dead < paired.length) {
                at_least_one_survivor++;
            }

            const iteration_values: number[] = new Array(pool_size).fill(0);
            chosen.forEach((citizen_index: number, slot: number) => {
                iteration_values[citizen_index] = slot < raw.length ? raw[slot] : 0;
            });
            for (let c: number = 0; c < pool_size; c++) {
                citizen_values[c].push(iteration_values[c]);
                if (iteration_values[c] > citizen_thresholds[c]) {
                    citizen_death_count[c]++;
                }
            }
        }

        const ranks: RankStat[] = rank_values.map((values: number[], index: number) => {
            values.sort((a: number, b: number) => a - b);
            const mean: number = values.reduce((a: number, b: number) => a + b, 0) / values.length;
            return {
                rank: index + 1,
                mean,
                min: values[0],
                max: values[values.length - 1],
                p5: this.percentile(values, 5),
                p95: this.percentile(values, 95),
                death_probability: rank_death_count[index] / values.length
            };
        });

        const citizens: CitizenStat[] = this.citizen_defenses.map((row: CitizenDefenseRow, index: number) => ({
            label: row.label,
            named: row.named,
            defense: citizen_thresholds[index],
            mean: this.mean(citizen_values[index]),
            death_probability: citizen_death_count[index] / iterations
        }));
        const defense_groups: DefenseGroupStat[] = this.buildDefenseGroups(citizens);

        const death_histogram: DeathHistogramEntry[] = new Array(n + 1);
        let cumulative_from_top: number = 0;
        for (let k: number = n; k >= 0; k--) {
            cumulative_from_top += death_counts[k];
            death_histogram[k] = {
                deaths: k,
                probability: death_counts[k] / iterations,
                at_least_probability: cumulative_from_top / iterations
            };
        }

        // Miroir du précédent : survivants = citoyens ciblés (n) moins les morts.
        const survivor_histogram: SurvivorHistogramEntry[] = new Array(n + 1);
        let cumulative_from_bottom: number = 0;
        for (let k: number = 0; k <= n; k++) {
            cumulative_from_bottom += death_counts[k];
            const survivors: number = n - k;
            survivor_histogram[survivors] = {
                survivors,
                probability: death_counts[k] / iterations,
                at_least_probability: cumulative_from_bottom / iterations
            };
        }

        const factor: number = factor_sum / iterations;
        return {
            label, factor, max_active: Math.round(attack * factor), attacking: Math.round(this.mean(attackings)), ranks, citizens,
            defense_groups, death_histogram, survivor_histogram,
            touched_mean: this.mean(touched),
            touched_min: Math.min(...touched),
            touched_max: Math.max(...touched),
            deaths_mean: this.mean(deaths),
            deaths_min: Math.min(...deaths),
            deaths_max: Math.max(...deaths),
            death_at_least_one: at_least_one_death / iterations,
            survivor_at_least_one: at_least_one_survivor / iterations
        };
    }

    /**
     * Regroupe les citoyens ciblables par défense identique : la probabilité de mort est la même en
     * espérance pour une même défense (sélection et répartition uniformes entre citoyens), la moyenne
     * du groupe est donc une estimation moins bruitée que celle de chaque citoyen pris isolément.
     */
    private buildDefenseGroups(citizens: CitizenStat[]): DefenseGroupStat[] {
        const groups: Map<number, CitizenStat[]> = new Map<number, CitizenStat[]>();
        for (const citizen of citizens) {
            const bucket: CitizenStat[] = groups.get(citizen.defense) ?? [];
            bucket.push(citizen);
            groups.set(citizen.defense, bucket);
        }
        return Array.from(groups.entries())
            .map(([defense, group]: [number, CitizenStat[]]) => ({
                defense,
                count: group.length,
                mean: this.mean(group.map((c: CitizenStat) => c.mean)),
                death_probability: this.mean(group.map((c: CitizenStat) => c.death_probability)),
                names: group.filter((c: CitizenStat) => c.named).map((c: CitizenStat) => c.label)
            }))
            .sort((a: DefenseGroupStat, b: DefenseGroupStat) => a.defense - b.defense);
    }

    /**
     * Répartition d'`attacking` zombies entre `n` emplacements, fidèle à l'algorithme du jeu :
     * poids aléatoires, un citoyen « malchanceux » (+0,3), normalisation puis distribution du reliquat.
     * @returns une valeur par emplacement, dans l'ordre d'entrée (correspond à l'ordre de {@link pickTargets})
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

        return rep;
    }

    /**
     * Tire `count` emplacements distincts parmi `[0, pool_size)` (mélange de Fisher-Yates partiel),
     * pour reproduire le tirage aléatoire des citoyens ciblés (NightlyHandler::random->pick).
     */
    private pickTargets(pool_size: number, count: number): number[] {
        const indices: number[] = Array.from({ length: pool_size }, (_: unknown, i: number) => i);
        const picked: number = Math.min(count, pool_size);
        for (let i: number = 0; i < picked; i++) {
            const j: number = i + Math.floor(Math.random() * (pool_size - i));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices.slice(0, picked);
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
