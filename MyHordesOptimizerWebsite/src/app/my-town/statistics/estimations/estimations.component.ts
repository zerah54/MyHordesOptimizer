import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import Chart from 'chart.js/auto';
import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { MinMax } from '../../../_abstract_model/interfaces';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { Regen } from '../../../_abstract_model/types/regen.class';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { getMaxAttack, getMinAttack } from '../../../shared/utilities/estimations.util';
import { getTown } from '../../../shared/utilities/localstorage.util';

@Component({
    selector: 'mho-estimations',
    templateUrl: './estimations.component.html',
    styleUrls: ['./estimations.component.scss']
})
export class EstimationsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

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

    public separators: string[] = [' à ', ' - '];

    constructor(private clipboard: ClipboardService, private api: ApiServices) {
    }

    public ngOnInit(): void {
        this.getEstimations();
    }

    /** Enregistre les estimations saisies */
    public saveEstimations(): void {
        this.api.saveEstimations(this.estimations).subscribe();
    }

    public getEstimations(): void {
        this.api.getEstimations(this.selected_day).subscribe((estimations: Estimations) => {
            this.estimations = estimations;
            setTimeout(() => {
                this.defineTodayCanvas();
                this.defineTomorrowCanvas();
            });
        });
    }

    private defineTodayCanvas(): void {
        if (this.today_canvas) {
            if (this.today_chart) {
                this.today_chart.destroy();
            }

            const today_ctx: CanvasRenderingContext2D = this.today_canvas.nativeElement.getContext('2d');
            this.today_chart = new Chart<'line'>(today_ctx, {
                type: 'line',
                data: {
                    labels: TDG_VALUES.map((value: number): string => value + '%'),
                    datasets: [
                        {
                            label: 'Minimum théorique',
                            data: Array(TDG_VALUES.length).fill(getMinAttack(this.selected_day, getTown()?.town_type || 'RE')),
                            spanGaps: true,
                            borderDash: [3, 3],
                        },
                        {
                            label: 'Attaque minimum',
                            data: TDG_VALUES.map((value: number) => +(this.estimations.estim['_' + value].min || 'NaN')),
                            spanGaps: true,
                        },
                        {
                            label: 'Attaque maximum',
                            data: TDG_VALUES.map((value: number) => +(this.estimations.estim['_' + value].max || 'NaN')),
                            spanGaps: true,
                        },
                        {
                            label: 'Maximum théorique',
                            data: Array(TDG_VALUES.length).fill(getMaxAttack(this.selected_day, getTown()?.town_type || 'RE')),
                            spanGaps: true,
                            borderDash: [3, 3],
                        },
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: $localize`Attaque du jour`
                        }
                    },
                    interaction: {
                        intersect: false
                    }
                }
            });
        }
    }

    private defineTomorrowCanvas(): void {
        if (this.tomorrow_canvas) {
            if (this.tomorrow_chart) {
                this.tomorrow_chart.destroy();
            }

            const tomorrow_ctx: CanvasRenderingContext2D = this.tomorrow_canvas.nativeElement.getContext('2d');
            this.tomorrow_chart = new Chart<'line'>(tomorrow_ctx, {
                type: 'line',
                data: {
                    labels: PLANIF_VALUES.map((value: number): string => value + '%'),
                    datasets: [
                        {
                            label: 'Minimum théorique',
                            data: Array(PLANIF_VALUES.length).fill(getMinAttack(this.selected_day + 1, getTown()?.town_type || 'RE')),
                            spanGaps: true,
                            borderDash: [3, 3],
                        },
                        {
                            label: 'Attaque minimum',
                            data: PLANIF_VALUES.map((value: number) => +(this.estimations.planif['_' + value].min || 'NaN')),
                            spanGaps: true,
                        },
                        {
                            label: 'Attaque maximum',
                            data: PLANIF_VALUES.map((value: number) => +(this.estimations.planif['_' + value].max || 'NaN')),
                            spanGaps: true,
                        },
                        {
                            label: 'Maximum théorique',
                            data: Array(PLANIF_VALUES.length).fill(getMaxAttack(this.selected_day + 1, getTown()?.town_type || 'RE')),
                            spanGaps: true,
                            borderDash: [3, 3],
                        },
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: $localize`Attaque du lendemain`
                        }
                    },
                    interaction: {
                        intersect: false
                    }
                }
            });
        }
    }

    public pasteFromMH(paste_event: ClipboardEvent, min_max: MinMax): void {
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
}
