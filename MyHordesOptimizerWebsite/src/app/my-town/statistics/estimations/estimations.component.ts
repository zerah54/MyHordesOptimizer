import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, Signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartDataset, ChartEvent, LegendElement, LegendItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { Color } from 'chartjs-plugin-datalabels/types/options';
import moment from 'moment';
import { firstValueFrom } from 'rxjs';

import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { MinMax } from '../../../_abstract_model/interfaces';
import { AdminService } from '../../../_abstract_model/services/admin.service';
import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Dictionary, Imports, TownTypeId } from '../../../_abstract_model/types/_types';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { EstimationGraphValues, EstimationsResult } from '../../../_abstract_model/types/estimations-result.class';
import { Regen } from '../../../_abstract_model/types/regen.class';
import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getMaxAttack, getMinAttack } from '../../../_core/utilities/estimations.util';
import { getTown } from '../../../_core/utilities/localstorage.util';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../_shared/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { deriveValueRange, isReboundPossible, NO_CONSTRAINT, RED_SOUL_FACTOR_CAP, RED_SOUL_PENALTY, RefinerParams } from './refiner/attack-model';
import { AttackRefinerService, RefineResult } from './refiner/attack-refiner.service';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [HeaderWithNumberPreviousNextFilterComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-estimations',
    templateUrl: './estimations.component.html',
    styleUrls: ['./estimations.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes, MatSlideToggle]
})
export class EstimationsComponent implements OnInit, OnDestroy {
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();
    protected readonly tdg_values: number[] = TDG_VALUES;
    protected readonly planif_values: number[] = PLANIF_VALUES;
    protected readonly current_day: number = getTown()?.day || 1;
    /** Mode observateur : masque la sauvegarde et verrouille la saisie (le refiner local reste actif). */
    protected readonly is_readonly: Signal<boolean> = inject(TownContextService).isReadonly;
    protected selected_day: number = this.current_day;
    protected estimations!: Estimations;
    protected today_offset_mode!: boolean;
    protected tomorrow_offset_mode!: boolean;
    protected today_calculated_attack!: EstimationsResult | null;
    protected tomorrow_calculated_attack!: EstimationsResult | null;
    /** Affinage GPU : jour en cours de scan (null si aucun) et progression 0..100. */
    protected refining_day: number | null = null;
    protected refine_progress: number = 0;
    /** Indicateurs « ça tourne » (purement affichage, n'influencent pas le calcul). */
    protected refine_elapsed_label: string = '';
    protected refine_eta_label: string = '';
    /**
     * À cocher si la gazette du jour affiné annonce l'explosion des feux d'artifice : l'attaque
     * réelle est réduite de 13 à 16 % et les cibles ont été décalées après les relevés du
     * planificateur de la veille (qui sont alors écartés du calcul).
     */
    protected fireworks_exploded: boolean = false;
    protected step?: number = 0;
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly today_estim_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('todayEstimCanvas');
    private readonly today_offset_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('todayOffsetCanvas');
    private readonly tomorrow_estim_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('tomorrowEstimCanvas');
    private readonly tomorrow_offset_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('tomorrowOffsetCanvas');
    private today_estim_chart!: Chart<'line'>;
    private today_offset_chart!: Chart<'bar'>;
    private tomorrow_estim_chart!: Chart<'line'>;
    private tomorrow_offset_chart!: Chart<'bar'>;
    /** Messages de résultat d'affinage par jour attaqué (clé '_<jour>'), conservés en naviguant. */
    private readonly refine_messages: Dictionary<string> = {};
    private refine_started_at: number = 0;
    private refine_fraction: number = 0;
    private refine_timer: ReturnType<typeof setInterval> | null = null;
    /** Plages de valeurs affinées par jour attaqué (clé '_<jour>'), conservées en naviguant. */
    private readonly refined_ranges: Dictionary<MinMax> = {};
    /** Nombre d'âmes rouges en ville (0 par défaut ; future saisie utilisateur). */
    private red_souls: number = 0;
    private separators: string[] = [' à ', ' - '];
    private town_statistics_service: TownStatisticsService = inject(TownStatisticsService);
    private refiner: AttackRefinerService = inject(AttackRefinerService);
    private admin_service: AdminService = inject(AdminService);

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        if (this.today_estim_chart) {
            this.today_estim_chart.resize();
        }
        if (this.today_offset_chart) {
            this.today_offset_chart.resize();
        }
        if (this.tomorrow_estim_chart) {
            this.tomorrow_estim_chart.resize();
        }
        if (this.tomorrow_offset_chart) {
            this.tomorrow_offset_chart.resize();
        }
    }

    public ngOnInit(): void {
        this.getEstimations();
    }

    public ngOnDestroy(): void {
        this.stopRefineTimer();
    }

    /** Enregistre les estimations saisies */
    protected saveEstimations(): void {
        this.town_statistics_service
            .saveEstimations(this.estimations)
            .subscribe(() => {
                this.getEstimations();
            });
    }

    protected getEstimations(): void {
        this.town_statistics_service
            .getEstimations(this.selected_day)
            .subscribe({
                next: (estimations: Estimations) => {
                    this.estimations = estimations;
                    this.town_statistics_service
                        .getAttackCalculation(this.selected_day, false)
                        .subscribe({
                            next: (result: EstimationsResult) => {
                                this.today_calculated_attack = result;
                                this.defineTodayCanvas();
                            }
                        });
                    this.town_statistics_service
                        .getAttackCalculation(this.selected_day + 1, false)
                        .subscribe({
                            next: (result: EstimationsResult) => {
                                this.tomorrow_calculated_attack = result;
                                this.defineTomorrowCanvas();
                            }
                        });
                }
            });
    }

    protected setStep(step: number): void {
        this.step = step;
    }

    /** Admin + WebGPU disponible → bouton « Affiner » actif. */
    protected canRefine(): boolean {
        return this.admin_service.isAdmin() && this.refiner.isSupported();
    }

    /**
     * Lance l'affinage GPU pour un panneau. `day` = jour attaqué D (jour sélectionné pour la TDG,
     * jour sélectionné + 1 pour le planificateur). Les contraintes TDG(D) et planificateur(D−1)
     * portent sur la même ZombieEstimation (même seed, mêmes offsets) : elles sont poolisées dans
     * un seul scan, quel que soit le panneau d'origine.
     */
    protected async refine(day: number, is_planif: boolean): Promise<void> {
        if (this.refining_day !== null) {
            return;
        }
        this.refining_day = day;
        this.refine_progress = 0;
        delete this.refine_messages['_' + day];
        delete this.refined_ranges['_' + day];
        this.refine_started_at = Date.now();
        this.refine_fraction = 0;
        this.updateRefineStats();
        this.refine_timer = setInterval((): void => this.updateRefineStats(), 1000);
        try {
            // Pool de contraintes du jour attaqué D : TDG(D) + planificateur(D−1). Le panneau d'origine
            // fournit ses valeurs déjà chargées, l'autre famille est récupérée auprès de l'API.
            // Slots : TDG min 0..24 / max 25..49 (bloc 1), planif min 50..74 / max 75..99 (bloc B).
            const estim_source: Dictionary<MinMax> | null = is_planif
                ? await this.getComplementaryValues(day, false)
                : this.estimations.estim;
            // Feux d'artifice explosés dans la nuit précédant le jour attaqué : les cibles ont été
            // décalées APRÈS les relevés du planificateur de la veille (mutation nocturne) → ses
            // paliers portent sur les cibles pré-explosion, incompatibles avec la TDG post-explosion.
            const planif_source: Dictionary<MinMax> | null = this.fireworks_exploded
                ? null
                : (is_planif ? this.estimations.planif : await this.getComplementaryValues(day, true));
            const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
            const has_estim: boolean = this.fillObserved(observed, estim_source, TDG_VALUES, 8, 0);
            const has_planif: boolean = this.fillObserved(observed, planif_source, PLANIF_VALUES, 0, 50);
            if (!has_estim && !has_planif) {
                this.setRefineMessage(day, $localize`Aucune estimation saisie à affiner`);
                return;
            }

            // Paramètres du modèle MyHordes pour le jour attaqué (jours tardifs : offsets réduits).
            // base_lo/hi = bornes mt_rand de l'offset de base ; le rebound (plage [protect, somme−protect],
            // sommes ±1 dues aux arrondis séparés de o1/o2) est géré dans le refiner.
            const factor: number = this.factorForDay(day);
            const town_type: TownTypeId = getTown()?.town_type || 'RE';
            const params: RefinerParams = {
                base_lo_rand: Math.round(factor * 5),
                base_hi_rand: Math.round(factor * 26),
                off_sum: Math.round(factor * 28),
                protect: day <= 30 ? 3 : 1,
                blocks: Math.ceil(day / 5) * 5,
                soul_factor: Math.min(1 + RED_SOUL_PENALTY * this.red_souls, RED_SOUL_FACTOR_CAP),
                shift_span: factor * 0.1,
                shift_steps: Math.round(factor * 1000),
                min_global: getMinAttack(day, town_type),
                max_global: getMaxAttack(day, town_type),
                rebound_possible: true,
                fireworks: this.fireworks_exploded
            };
            // Gate rebound : si les bornes cibles déduites des saisies excluent tout deshift des offsets,
            // seule la configuration nominale (somme exacte, base ∈ [f·5, f·26]) est scannée (≈ ×3).
            params.rebound_possible = isReboundPossible(observed, params);

            const result: RefineResult = await this.refiner.refine(observed, params, (fraction: number): void => {
                this.refine_progress = Math.round(fraction * 100);
                this.refine_fraction = fraction;
                this.updateRefineStats();
            });
            if (result.cancelled) {
                this.setRefineMessage(day, $localize`Affinage annulé`);
                return;
            }
            const range: number[] = deriveValueRange(observed, result.hits, params);
            if (range.length === 0) {
                this.setRefineMessage(day, $localize`Aucune configuration compatible trouvée`);
                return;
            }
            const refined: MinMax = { min: range[0], max: range[range.length - 1] };
            this.refined_ranges['_' + day] = refined;
            // Les deux graphes relisent les plages par jour attaqué : le jour affiné peut correspondre
            // à l'un ou l'autre panneau si le jour sélectionné a changé pendant le calcul.
            this.defineTodayCanvas();
            this.defineTomorrowCanvas();
            let message: string = $localize`Attaque affinée` + ` : [${refined.min} - ${refined.max}]`;
            if (result.overflow) {
                message += $localize`Plage possiblement incomplète, saisissez plus de paliers`;
            }
            this.setRefineMessage(day, message);
        } catch (error) {
            console.error(`Affinage J${day} :`, error);
            const details: string = error instanceof Error && error.message ? ` (${error.message})` : '';
            this.setRefineMessage(day, $localize`Erreur pendant l'affinage` + details);
        } finally {
            this.stopRefineTimer();
            this.refining_day = null;
        }
    }

    protected cancelRefine(): void {
        this.refiner.cancel();
    }

    /** Message du dernier affinage du jour attaqué, ou null. */
    protected refineMessageFor(day: number): string | null {
        return this.refine_messages['_' + day] || null;
    }

    protected pasteFromMH(paste_event: ClipboardEvent, min_max: MinMax, min: boolean): void {
        paste_event.preventDefault();
        const value: string | undefined = paste_event.clipboardData?.getData('Text');
        let split: string[] | undefined;
        this.separators.forEach((separator: string) => {
            const splitted: string[] | undefined = value?.split(separator);
            if (splitted && splitted.length > 1) {
                split = splitted;
            }
        });

        if (split && split.length > 1) {
            min_max.min = +split[0];
            min_max.max = +split[1];
        } else if (split?.length === 1) {
            min_max[min ? 'min' : 'max'] = +split[0];
        } else {
            min_max[min ? 'min' : 'max'] = value ? +value : undefined;
        }
    }

    protected shareEstimsForum(): void {
        const today_attack_title: string = $localize`Attaque du jour`;
        const tomorrow_attack_title: string = $localize`Attaque du lendemain`;
        let text: string = '';

        /** Ajout du titre **/
        text += `[big][b][bad]J${this.selected_day}[/bad][/b][/big]{hr}\n`;

        /** Ajout du titre "Attaque du jour" */
        text += `[i]${today_attack_title} (J${this.selected_day})[/i]\n`;

        /** Ajout des valeurs du jour */
        TDG_VALUES.forEach((value_key: number) => {
            const value: MinMax = this.estimations.estim['_' + value_key];
            if (value && (value.min || value.max)) {
                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
            }
        });

        text += '{hr}\n';

        /** Ajout du titre "Attaque du lendemain" */
        text += `[i]${tomorrow_attack_title} (J${this.selected_day + 1})[/i]\n`;

        /** Ajout des valeurs du lendemain */
        PLANIF_VALUES.forEach((value_key: number) => {
            const value: MinMax = this.estimations.planif['_' + value_key];
            if (value && (value.min || value.max)) {
                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
            }
        });

        text += '{hr}';


        this.clipboard.copy(text, $localize`La liste a bien été copiée au format forum`);

    }

    /** Plage affinée du jour attaqué, ou null si aucun affinage n'a abouti pour ce jour. */
    private refinedAttackFor(day: number): MinMax | null {
        return this.refined_ranges['_' + day] || null;
    }

    private setRefineMessage(day: number, message: string): void {
        this.refine_messages['_' + day] = message;
    }

    /**
     * Valeurs complémentaires pour le jour attaqué D : TDG(D) (`planif` = false) ou
     * planificateur(D−1) (`planif` = true). Retourne null si le jour à charger est hors plage
     * (D−1 < 1, ou TDG d'un jour futur).
     */
    private async getComplementaryValues(attack_day: number, planif: boolean): Promise<Dictionary<MinMax> | null> {
        const fetch_day: number = planif ? attack_day - 1 : attack_day;
        if (fetch_day < 1 || fetch_day > this.current_day) {
            return null;
        }
        try {
            const estimations: Estimations = await firstValueFrom(this.town_statistics_service.getEstimations(fetch_day));
            return planif ? estimations.planif : estimations.estim;
        } catch (error) {
            // Le pool est une optimisation : en cas d'échec de l'appel API, on affine sans la famille
            // complémentaire plutôt que de faire échouer tout l'affinage.
            console.warn(`Estimations complémentaires J${fetch_day} indisponibles :`, error);
            return null;
        }
    }

    /**
     * Copie les paliers saisis d'une famille dans `observed` (q = q_offset + index du pourcentage,
     * min en slot_offset + q, max en slot_offset + 25 + q). Retourne true si au moins un palier
     * a été rempli.
     */
    private fillObserved(observed: Int32Array, values: Dictionary<MinMax> | null, percents: number[], q_offset: number, slot_offset: number): boolean {
        if (!values) {
            return false;
        }
        let filled: boolean = false;
        percents.forEach((percent: number, index: number) => {
            const q: number = q_offset + index;
            if (q > 24) {
                return;
            }
            const entry: MinMax = values['_' + percent];
            const min: number = entry ? Number(entry.min) : NaN;
            const max: number = entry ? Number(entry.max) : NaN;
            if (Number.isFinite(min) && min > 0) {
                observed[slot_offset + q] = min;
                filled = true;
            }
            if (Number.isFinite(max) && max > 0) {
                observed[slot_offset + 25 + q] = max;
                filled = true;
            }
        });
        return filled;
    }

    private stopRefineTimer(): void {
        if (this.refine_timer !== null) {
            clearInterval(this.refine_timer);
            this.refine_timer = null;
        }
    }

    /** Recalcule les libellés temps écoulé / ETA / seeds scannés (affichage seul). Durées via moment. */
    private updateRefineStats(): void {
        const elapsed_s: number = (Date.now() - this.refine_started_at) / 1000;
        this.refine_elapsed_label = moment.duration(elapsed_s, 'seconds').humanize();
        if (this.refine_fraction > 0.005) {
            const eta_s: number = Math.max(0, elapsed_s / this.refine_fraction - elapsed_s);
            this.refine_eta_label = $localize`~${moment.duration(eta_s, 'seconds').humanize()} restant(es)`;
        } else {
            this.refine_eta_label = $localize`estimation du temps...`;
        }
    }

    /** Facteur d'atténuation des offsets selon le jour (identique au modèle MyHordes). */
    private factorForDay(day: number): number {
        return day <= 15 ? 1 : day <= 20 ? 0.75 : day <= 30 ? 0.5 : day <= 40 ? 0.25 : 0.15;
    }

    private defineTodayCanvas(): void {
        const today_estim_canvas: ElementRef = this.today_estim_canvas();
        if (today_estim_canvas) {
            if (this.today_estim_chart) {
                this.today_estim_chart.destroy();
            }
            const today_estim_ctx: CanvasRenderingContext2D = today_estim_canvas.nativeElement.getContext('2d');
            this.today_estim_chart = new Chart<'line'>(today_estim_ctx, this.getEstimConfig(this.selected_day, TDG_VALUES, this.estimations.estim, this.today_calculated_attack?.result, this.refinedAttackFor(this.selected_day)));
        }

        const today_offset_canvas: ElementRef = this.today_offset_canvas();
        if (today_offset_canvas) {
            if (this.today_offset_chart) {
                this.today_offset_chart.destroy();
            }
            const today_offset_ctx: CanvasRenderingContext2D = today_offset_canvas.nativeElement.getContext('2d');
            this.today_offset_chart = new Chart<'bar'>(today_offset_ctx, this.getOffsetConfig(this.selected_day, this.today_calculated_attack?.min_list, this.today_calculated_attack?.max_list));
        }
    }

    private defineTomorrowCanvas(): void {
        const tomorrow_estim_canvas: ElementRef = this.tomorrow_estim_canvas();
        if (tomorrow_estim_canvas) {
            if (this.tomorrow_estim_chart) {
                this.tomorrow_estim_chart.destroy();
            }
            const tomorrow_estim_ctx: CanvasRenderingContext2D = tomorrow_estim_canvas.nativeElement.getContext('2d');
            this.tomorrow_estim_chart = new Chart<'line'>(tomorrow_estim_ctx, this.getEstimConfig(this.selected_day + 1, PLANIF_VALUES, this.estimations.planif, this.tomorrow_calculated_attack?.result, this.refinedAttackFor(this.selected_day + 1)));
        }

        const tomorrow_offset_canvas: ElementRef = this.tomorrow_offset_canvas();
        if (tomorrow_offset_canvas) {
            if (this.tomorrow_offset_chart) {
                this.tomorrow_offset_chart.destroy();
            }
            const tomorrow_offset_ctx: CanvasRenderingContext2D = tomorrow_offset_canvas.nativeElement.getContext('2d');
            this.tomorrow_offset_chart = new Chart<'bar'>(tomorrow_offset_ctx, this.getOffsetConfig(this.selected_day + 1, this.tomorrow_calculated_attack?.min_list, this.tomorrow_calculated_attack?.max_list));
        }
    }

    private clickOnLegendItem(_event: ChartEvent, legendItem: LegendItem, legend: LegendElement<'line'>): void {
        const hidden: boolean = !legend.chart.getDatasetMeta(<number>legendItem.datasetIndex).hidden;
        const dataSetIndex: number[] = legendItem.datasetIndex === 1 ? [0, 1] : (legendItem.datasetIndex === 3 ? [2, 3] : [4, 5]);
        dataSetIndex.forEach((i: number) => legend.chart.getDatasetMeta(i).hidden = hidden);
        legend.chart.update();
    }

    private generateLegendLabels(chart: Chart<'line'>): LegendItem[] {
        return chart.data.datasets
            .map((ds: ChartDataset<'line'>, i: number): LegendItem => ({
                text: ds.label?.substring(0, ds.label.indexOf('-')) || '',
                datasetIndex: i,
                fontColor: <Color>Chart.defaults.color,
                fillStyle: <Color>chart.data.datasets[i].backgroundColor,
                strokeStyle: <Color>chart.data.datasets[i].borderColor,
                lineDash: <number[]>chart.data.datasets[i].borderDash,
                lineWidth: 3,
                hidden: chart.getDatasetMeta(i).hidden
            }))
            .filter((_ds: LegendItem, i: number) => i % 2);
    }

    private getEstimConfig(day: number, PERCENTS: number[], values: Dictionary<MinMax>, calculated_attack: MinMax | undefined)
        : ChartConfiguration<'line'> {
        return {
            type: 'line',
            data: {
                labels: PERCENTS.map((value: number): string => value + '%'),
                datasets: [
                    {
                        label: $localize`Attaque théorique - Min`,
                        data: Array(PERCENTS.length).fill(getMinAttack(day, getTown()?.town_type || 'RE')),
                        spanGaps: true,
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB88',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: $localize`Attaque théorique - Max`,
                        data: Array(PERCENTS.length).fill(getMaxAttack(day, getTown()?.town_type || 'RE')),
                        spanGaps: true,
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB88',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: $localize`Attaque J${day} calculée - Min`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.min),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée - Max`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.max),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Estimation de l'attaque - Min`,
                        data: PERCENTS.map((value: number) => +(values['_' + value].min || 'NaN')),
                        spanGaps: true,
                        borderColor: '#4BC0C0',
                        backgroundColor: '#4BC0C088'
                    },
                    {
                        label: $localize`Estimation de l'attaque - Max`,
                        data: PERCENTS.map((value: number) => +(values['_' + value].max || 'NaN')),
                        spanGaps: true,
                        borderColor: '#4BC0C0',
                        backgroundColor: '#4BC0C088'
                    },
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            generateLabels: this.generateLegendLabels
                        },
                        onClick: this.clickOnLegendItem
                    }
                },
                interaction: {
                    intersect: false
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        };
    }

    private getOffsetConfig(day: number, values_min: EstimationGraphValues[] | undefined, values_max: EstimationGraphValues[] | undefined)
        : ChartConfiguration<'bar'> {
        return {
            type: 'bar',
            data: {
                labels: (values_min ?? []).map((value: EstimationGraphValues) => value.value),
                datasets: [
                    {
                        label: $localize`Répartition des valeurs possibles J${day} - Min`,
                        data: (values_min ?? []).map((value: EstimationGraphValues) => value.count),
                    },
                    {
                        label: $localize`Répartition des valeurs possibles J${day} - Max`,
                        data: (values_max ?? []).map((value: EstimationGraphValues) => value.count),
                    }
                ]
            },
            options: {
                interaction: {
                    intersect: false
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        };
    }
}
