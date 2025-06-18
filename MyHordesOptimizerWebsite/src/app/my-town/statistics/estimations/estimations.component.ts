import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, HostListener, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartEvent, LegendElement, ChartDataset, LegendItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { Color } from 'chartjs-plugin-datalabels/types/options';
import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { MinMax } from '../../../_abstract_model/interfaces';
import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Dictionary, Imports } from '../../../_abstract_model/types/_types';
import { EstimationGraphValues, EstimationsResult } from '../../../_abstract_model/types/estimations-result.class';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { Regen } from '../../../_abstract_model/types/regen.class';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { getMaxAttack, getMinAttack } from '../../../shared/utilities/estimations.util';
import { getTown } from '../../../shared/utilities/localstorage.util';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [HeaderWithNumberPreviousNextFilterComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-estimations',
    templateUrl: './estimations.component.html',
    styleUrls: ['./estimations.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [...angular_common, ...components, ...material_modules, ...pipes, MatSlideToggle]
})
export class EstimationsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @HostListener('window:resize', ['$event'])
    onResize(): void {
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

    @ViewChild('todayEstimCanvas') today_estim_canvas!: ElementRef;
    @ViewChild('todayOffsetCanvas') today_offset_canvas!: ElementRef;
    @ViewChild('tomorrowEstimCanvas') tomorrow_estim_canvas!: ElementRef;
    @ViewChild('tomorrowOffsetCanvas') tomorrow_offset_canvas!: ElementRef;

    public readonly tdg_values: number[] = TDG_VALUES;
    public readonly planif_values: number[] = PLANIF_VALUES;
    public readonly current_day: number = getTown()?.day || 1;

    public selected_day: number = this.current_day;
    public estimations!: Estimations;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();

    public today_estim_chart!: Chart<'line'>;
    public today_offset_chart!: Chart<'bar'>;
    public today_offset_mode!: boolean;
    public tomorrow_estim_chart!: Chart<'line'>;
    public tomorrow_offset_chart!: Chart<'bar'>;
    public tomorrow_offset_mode!: boolean;

    public today_calculated_attack!: EstimationsResult | null;
    public today_calculated_attack_beta!: EstimationsResult | null;
    public tomorrow_calculated_attack!: EstimationsResult | null;
    public tomorrow_calculated_attack_beta!: EstimationsResult | null;

    public step?: number = 0;

    public separators: string[] = [' à ', ' - '];

    private town_statistics_service: TownStatisticsService = inject(TownStatisticsService);

    constructor(private clipboard: ClipboardService) {
    }

    public ngOnInit(): void {
        this.getEstimations();
    }

    /** Enregistre les estimations saisies */
    public saveEstimations(): void {
        this.town_statistics_service
            .saveEstimations(this.estimations)
            .subscribe(() => {
                this.getEstimations();
            });
    }

    public getEstimations(): void {
        this.town_statistics_service
            .getEstimations(this.selected_day)
            .subscribe({
                next: (estimations: Estimations) => {
                    this.estimations = estimations;
                    this.town_statistics_service
                        .getApofooAttackCalculation(this.selected_day, false)
                        .subscribe({
                            next: (result: EstimationsResult) => {
                                this.today_calculated_attack = result;
                                this.town_statistics_service
                                    .getApofooAttackCalculation(this.selected_day, true)
                                    .subscribe({
                                        next: (result: EstimationsResult) => {
                                            this.today_calculated_attack_beta = result;
                                            this.defineTodayCanvas();
                                        }
                                    });
                            }
                        });
                    this.town_statistics_service
                        .getApofooAttackCalculation(this.selected_day + 1, false)
                        .subscribe({
                            next: (result: EstimationsResult) => {
                                this.tomorrow_calculated_attack = result;
                                this.town_statistics_service
                                    .getApofooAttackCalculation(this.selected_day + 1, true)
                                    .subscribe({
                                        next: (result: EstimationsResult) => {
                                            this.tomorrow_calculated_attack_beta = result;
                                            this.defineTomorrowCanvas();
                                        }
                                    });
                            }
                        });
                }
            });
    }

    public setStep(step: number): void {
        this.step = step;
    }

    public defineTodayCanvas(): void {
        if (this.today_estim_canvas) {
            if (this.today_estim_chart) {
                this.today_estim_chart.destroy();
            }
            const today_estim_ctx: CanvasRenderingContext2D = this.today_estim_canvas.nativeElement.getContext('2d');
            this.today_estim_chart = new Chart<'line'>(today_estim_ctx, this.getEstimConfig(this.selected_day, TDG_VALUES, this.estimations.estim, this.today_calculated_attack?.result, this.today_calculated_attack_beta?.result));
        }

        if (this.today_offset_canvas) {
            if (this.today_offset_chart) {
                this.today_offset_chart.destroy();
            }
            const today_offset_ctx: CanvasRenderingContext2D = this.today_offset_canvas.nativeElement.getContext('2d');
            this.today_offset_chart = new Chart<'bar'>(today_offset_ctx, this.getOffsetConfig(this.selected_day, this.today_calculated_attack?.min_list, this.today_calculated_attack?.max_list));
        }
    }

    public defineTomorrowCanvas(): void {
        if (this.tomorrow_estim_canvas) {
            if (this.tomorrow_estim_chart) {
                this.tomorrow_estim_chart.destroy();
            }
            const tomorrow_estim_ctx: CanvasRenderingContext2D = this.tomorrow_estim_canvas.nativeElement.getContext('2d');
            this.tomorrow_estim_chart = new Chart<'line'>(tomorrow_estim_ctx, this.getEstimConfig(this.selected_day + 1, PLANIF_VALUES, this.estimations.planif, this.tomorrow_calculated_attack?.result, this.tomorrow_calculated_attack_beta?.result));
        }

        if (this.tomorrow_offset_canvas) {
            if (this.tomorrow_offset_chart) {
                this.tomorrow_offset_chart.destroy();
            }
            const tomorrow_offset_ctx: CanvasRenderingContext2D = this.tomorrow_offset_canvas.nativeElement.getContext('2d');
            this.tomorrow_offset_chart = new Chart<'bar'>(tomorrow_offset_ctx, this.getOffsetConfig(this.selected_day + 1, this.tomorrow_calculated_attack?.min_list, this.tomorrow_calculated_attack_beta?.max_list));
        }
    }

    public pasteFromMH(paste_event: ClipboardEvent, min_max: MinMax, min: boolean): void {
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

    public shareEstimsForum(): void {
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
                fontColor: chart.legend?.options.labels.color,
                fillStyle: <Color>chart.data.datasets[i].backgroundColor,
                strokeStyle: <Color>chart.data.datasets[i].borderColor,
                lineDash: <number[]>chart.data.datasets[i].borderDash,
                lineWidth: 3,
                hidden: chart.getDatasetMeta(i).hidden
            }))
            .filter((_ds: LegendItem, i: number) => i % 2);
    }

    private getEstimConfig(day: number, PERCENTS: number[], values: Dictionary<MinMax>, calculated_attack: MinMax | undefined, calculated_attack_beta: MinMax | undefined)
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
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque théorique - Max`,
                        data: Array(PERCENTS.length).fill(getMaxAttack(day, getTown()?.town_type || 'RE')),
                        spanGaps: true,
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB88',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée (Par Apofoo) - Min`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.min),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée (Par Apofoo) - Max`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.max),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée (Par Apofoo) (beta) - Min`,
                        data: Array(PERCENTS.length).fill(calculated_attack_beta?.min),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: $localize`Attaque J${day} calculée (Par Apofoo) (beta) - Max`,
                        data: Array(PERCENTS.length).fill(calculated_attack_beta?.max),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
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
