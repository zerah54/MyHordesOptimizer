import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostBinding, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartEvent, LegendElement } from 'chart.js';
import Chart from 'chart.js/auto';
import { ChartDataset, LegendItem } from 'chart.js/dist/types';
import { Color } from 'chartjs-plugin-datalabels/types/options';
import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { MinMax } from '../../../_abstract_model/interfaces';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { Dictionary } from '../../../_abstract_model/types/_types';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { Regen } from '../../../_abstract_model/types/regen.class';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { getMaxAttack, getMinAttack } from '../../../shared/utilities/estimations.util';
import { getTown } from '../../../shared/utilities/localstorage.util';

@Component({
    selector: 'mho-estimations',
    templateUrl: './estimations.component.html',
    styleUrls: ['./estimations.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [HeaderWithNumberPreviousNextFilterComponent, MatButtonModule, MatTooltipModule, MatIconModule, NgIf, NgFor, MatFormFieldModule, MatInputModule, FormsModule, MatExpansionModule]
})
export class EstimationsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        if (this.today_chart) {
            this.today_chart.resize();
        }
        if (this.tomorrow_chart) {
            this.tomorrow_chart.resize();
        }
    }

    @ViewChild('todayCanvas') today_canvas!: ElementRef;
    @ViewChild('tomorrowCanvas') tomorrow_canvas!: ElementRef;

    public readonly tdg_values: number[] = TDG_VALUES;
    public readonly planif_values: number[] = PLANIF_VALUES;
    public readonly current_day: number = getTown()?.day || 1;

    public selected_day: number = this.current_day;
    public estimations!: Estimations;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();

    public today_chart!: Chart<'line'>;
    public tomorrow_chart!: Chart<'line'>;

    public today_calculated_attack!: MinMax | null;
    public today_calculated_attack_beta!: MinMax | null;
    public tomorrow_calculated_attack!: MinMax | null;
    public tomorrow_calculated_attack_beta!: MinMax | null;

    public step?: number = 0;

    public separators: string[] = [' à ', ' - '];

    constructor(private clipboard: ClipboardService, private api: ApiService) {
    }

    public ngOnInit(): void {
        this.getEstimations();
    }

    /** Enregistre les estimations saisies */
    public saveEstimations(): void {
        this.api.saveEstimations(this.estimations).subscribe(() => {
            this.getEstimations();
        });
    }

    public getEstimations(): void {
        this.api.getEstimations(this.selected_day).subscribe((estimations: Estimations) => {
            this.estimations = estimations;
            this.api.getApofooAttackCalculation(this.selected_day, false).subscribe((result: MinMax | null) => {
                this.today_calculated_attack = result;
                this.api.getApofooAttackCalculation(this.selected_day, true).subscribe((result: MinMax | null) => {
                    this.today_calculated_attack_beta = result;
                    this.defineTodayCanvas();
                });
            });
            this.api.getApofooAttackCalculation(this.selected_day + 1, false).subscribe((result: MinMax | null) => {
                this.tomorrow_calculated_attack = result;
                this.api.getApofooAttackCalculation(this.selected_day + 1, true).subscribe((result: MinMax | null) => {
                    this.tomorrow_calculated_attack_beta = result;
                    this.defineTomorrowCanvas();
                });
            });
        });
    }

    public setStep(step: number): void {
        this.step = step;
    }

    private defineTodayCanvas(): void {
        if (this.today_canvas) {
            if (this.today_chart) {
                this.today_chart.destroy();
            }

            const today_ctx: CanvasRenderingContext2D = this.today_canvas.nativeElement.getContext('2d');
            this.today_chart = new Chart<'line'>(today_ctx, this.getConfig(this.selected_day, TDG_VALUES, this.estimations.estim, this.today_calculated_attack, this.today_calculated_attack_beta));
        }
    }

    private defineTomorrowCanvas(): void {
        if (this.tomorrow_canvas) {
            if (this.tomorrow_chart) {
                this.tomorrow_chart.destroy();
            }

            const tomorrow_ctx: CanvasRenderingContext2D = this.tomorrow_canvas.nativeElement.getContext('2d');
            this.tomorrow_chart = new Chart<'line'>(tomorrow_ctx, this.getConfig(this.selected_day + 1, PLANIF_VALUES, this.estimations.planif, this.tomorrow_calculated_attack, this.tomorrow_calculated_attack_beta));
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
        text += `[big][b][bad]J${this.current_day}[/bad][/b][/big]{hr}\n`;

        /** Ajout du titre "Attaque du jour" */
        text += `[i]${today_attack_title} (J${this.current_day})[/i]\n`;

        /** Ajout des valeurs du jour */
        TDG_VALUES.forEach((value_key: number) => {
            const value: MinMax = this.estimations.estim['_' + value_key];
            if (value && (value.min || value.max)) {
                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
            }
        });

        text += '{hr}\n';

        /** Ajout du titre "Attaque du lendemain" */
        text += `[i]${tomorrow_attack_title} (J${this.current_day + 1})[/i]\n`;

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

    private getConfig(day: number, PERCENTS: number[], values: Dictionary<MinMax>, calculated_attack: MinMax | null, calculated_attack_beta: MinMax | null)
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
                        label: $localize`Attaque J${day} calculée (By Apofoo) - Min`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.min),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée (By Apofoo) - Max`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.max),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée (By Apofoo) (beta) - Min`,
                        data: Array(PERCENTS.length).fill(calculated_attack_beta?.min),
                        spanGaps: true,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF638488',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: $localize`Attaque J${day} calculée (By Apofoo) (beta) - Max`,
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
}
