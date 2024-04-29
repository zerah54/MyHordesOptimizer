import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, HostBinding, inject, OnInit, ViewChild } from '@angular/core';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import Chart from 'chart.js/auto';
import { Subject, takeUntil } from 'rxjs';
import { Direction } from '../../../_abstract_model/enum/direction.enum';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Regen } from '../../../_abstract_model/types/regen.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { groupBy } from '../../../shared/utilities/array.util';

// import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';

const angular_common: Imports = [CommonModule, NgClass];
const components: Imports = [];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatSortModule, MatTableModule];

@Component({
    selector: 'mho-scrutateur',
    templateUrl: './scrutateur.component.html',
    styleUrls: ['./scrutateur.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ScrutateurComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('pieCanvas') pie_canvas!: ElementRef;
    @ViewChild('polarCanvas') polar_canvas!: ElementRef;

    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();
    /** La liste des colonnes */
    public columns: StandardColumn[] = [
        { id: 'day', header: $localize`Jour`, sticky: true },
        { id: 'direction_regen', header: $localize`Direction`, class: '' },
        { id: 'level_regen', header: $localize`Niveau`, class: '' },
        { id: 'taux_regen', header: $localize`Taux`, class: '' }
    ];

    public polar_chart!: Chart<'polarArea'>;
    public pie_chart!: Chart<'pie'>;

    private all_zones_regen: Direction[] = (<Direction[]>Direction.getAllValues()).sort((zone_a: Direction, zone_b: Direction) => {
        return zone_a.value.order_by - zone_b.value.order_by;
    });

    private town_statistics_service: TownStatisticsService = inject(TownStatisticsService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    ngOnInit(): void {
        this.town_statistics_service
            .getScrutList()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((regens: Regen[]): void => {
                this.datasource.data = [...regens];

                let regens_for_polar: Regen[] = [...regens];
                regens_for_polar = regens_for_polar.filter((regen: Regen) => regen && regen.direction_regen);
                regens_for_polar.sort((regen_a: Regen, regen_b: Regen) => {
                    return (<Direction>regen_a.direction_regen).value.order_by - (<Direction>regen_b.direction_regen).value.order_by;
                });
                let polar_data: number[] = new Array(8).fill(0);
                polar_data = polar_data.map((_data: number, index: number) => {
                    return regens_for_polar.filter((regen: Regen): boolean => regen.direction_regen?.value.order_by === index + 1).length;
                });
                const polar_ctx: CanvasRenderingContext2D = this.polar_canvas.nativeElement.getContext('2d');
                this.polar_chart = new Chart<'polarArea'>(polar_ctx, {
                    type: 'polarArea',
                    data: {
                        labels: this.all_zones_regen.map((zone: Direction) => zone.getLabel()),
                        datasets: [{
                            data: polar_data
                        }]
                    },
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: $localize`Direction des regénérations`
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            r: {
                                startAngle: -(360 / 8) / 2,
                                pointLabels: {
                                    display: true,
                                    centerPointLabels: true
                                },
                                ticks: {
                                    display: false
                                }
                            }
                        }
                    }
                });

                let regens_for_pie: Regen[] = [...regens];
                regens_for_pie = regens_for_pie.filter((regen: Regen) => regen && regen.direction_regen);
                regens_for_pie.sort((regen_a: Regen): number => {
                    return (<Direction>regen_a.direction_regen).value.diag ? 1 : -1;
                });
                const group_by_diag: Regen[][] = groupBy(regens_for_pie, this.groupByDiago);
                const pie_data: number[] = [];
                group_by_diag.forEach((regen: Regen[]): void => {
                    pie_data.push(regen.length);
                });

                const pie_ctx: CanvasRenderingContext2D = this.pie_canvas.nativeElement.getContext('2d');
                this.pie_chart = new Chart<'pie'>(pie_ctx, {
                    type: 'pie',
                    data: {
                        labels: [$localize`Droite`, $localize`Diagonale`],
                        datasets: [{
                            data: pie_data
                        }]
                    },
                    // plugins: [ChartDataLabels],
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: $localize`Axe des regénérations`
                            },
                            legend: {
                                position: 'bottom'
                            },
                            // datalabels: {
                            //     formatter: (value: number, ctx: Context): string => {
                            //         const data_array: number[] = <number[]>ctx.chart.data.datasets[0].data;
                            //         const sum: number = data_array.reduce((accumulator: number, value: number) => accumulator + value, 0);
                            //         const percentage: number = (value * 100 / sum);
                            //         return percentage.toFixed(2) + ' %';
                            //     }
                            // }
                        }
                    }
                });
            });
    }

    public groupByDiago(item: Regen): string {
        return (<Direction>item.direction_regen).value.diag + '';
    }
}
