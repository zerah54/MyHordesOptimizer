import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { Regen } from 'src/app/_abstract_model/types/regen.class';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { ZoneRegen } from '../../../_abstract_model/enum/zone-regen.enum';
import { MatTableDataSource } from '@angular/material/table';
import { groupBy } from '../../../shared/utilities/array.util';
import Chart from 'chart.js/auto';

// import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';

@Component({
    selector: 'mho-scrutateur',
    templateUrl: './scrutateur.component.html',
    styleUrls: ['./scrutateur.component.scss']
})
export class ScrutateurComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('pieCanvas') pie_canvas!: ElementRef;
    @ViewChild('polarCanvas') polar_canvas!: ElementRef;

    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();
    /** La liste des colonnes */
    public columns: RegenColumn[] = [
        {id: 'day', label: $localize`Jour`, class: ''},
        {id: 'direction_regen', label: $localize`Direction`, class: ''},
        {id: 'level_regen', label: $localize`Niveau`, class: ''},
        {id: 'taux_regen', label: $localize`Taux`, class: ''}
    ];

    public polar_chart!: Chart<'polarArea'>;
    public pie_chart!: Chart<'pie'>;

    /** La liste des id des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: RegenColumn) => column.id);

    private all_zones_regen: ZoneRegen[] = (<ZoneRegen[]>ZoneRegen.getAllValues()).sort((zone_a: ZoneRegen, zone_b: ZoneRegen) => {
        return zone_a.value.order_by - zone_b.value.order_by;
    });

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getScrutList()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((regens: Regen[]) => {
                this.datasource.data = [...regens];

                let regens_for_polar: Regen[] = [...regens];
                regens_for_polar = regens_for_polar.filter((regen: Regen) => regen && regen.direction_regen);
                regens_for_polar.sort((regen_a: Regen, regen_b: Regen) => {
                    return (<ZoneRegen>regen_a.direction_regen).value.order_by - (<ZoneRegen>regen_b.direction_regen).value.order_by;
                });
                const group_by_direction: Regen[][] = groupBy(regens_for_polar, this.groupByRegenDirection);
                const polar_data: number[] = [];
                group_by_direction.forEach((regen: Regen[]) => {
                    polar_data.push(regen.length);
                });
                const polar_ctx: CanvasRenderingContext2D = this.polar_canvas.nativeElement.getContext('2d');
                this.polar_chart = new Chart<'polarArea'>(polar_ctx, {
                    type: 'polarArea',
                    data: {
                        labels: this.all_zones_regen.map((zone: ZoneRegen) => zone.getLabel()),
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
                regens_for_pie.sort((regen_a: Regen) => {
                    return (<ZoneRegen>regen_a.direction_regen).value.diag ? 1 : -1;
                });
                const group_by_diag: Regen[][] = groupBy(regens_for_pie, this.groupByDiago);
                const pie_data: number[] = [];
                group_by_diag.forEach((regen: Regen[]) => {
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

    public trackByColumnId(index: number, column: RegenColumn): string {
        return column.id;
    }

    public groupByRegenDirection(item: Regen): string {
        return item.direction_regen?.key || '';
    }

    public groupByDiago(item: Regen): string {
        return (<ZoneRegen>item.direction_regen).value.diag + '';
    }
}

interface RegenColumn {
    id: string;
    label: string;
    class: string;
}
