import { Component, ElementRef, HostBinding, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Scale, TooltipItem } from 'chart.js';
import Chart from 'chart.js/auto';
import * as moment from 'moment';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';

@Component({
    selector: 'mho-registry-doors',
    templateUrl: './doors-registry.component.html',
    styleUrls: ['./doors-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true
})
export class DoorsRegistryComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('doorsCanvas') doors_canvas!: ElementRef;

    @Input({ required: true }) completeCitizenList!: CitizenInfo;
    @Input({ required: true }) displayPseudo!: 'simple' | 'id_mh';

    @Input({ required: true }) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry.filter((entry: Entry) => {
                return this.doors_entering_keywords.some((doors_entering: string): boolean => entry.entry?.indexOf(' ' + doors_entering) > -1)
                    || this.doors_leaving_keywords.some((doors_leaving: string): boolean => entry.entry?.indexOf(' ' + doors_leaving) > -1);
            });
            setTimeout(() => {
                this.createDoorsCanvas();
            });
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];
    protected doors_chart!: Chart<'bar'>;

    private readonly doors_leaving_keywords: string[] = ['a quitté la ville', 'left', 'verlassen', 'ha salido del'];
    private readonly doors_entering_keywords: string[] = ['est de retour en ville', 'entered', 'betreten', 'está de vuelta en el'];

    private createDoorsCanvas(): void {
        const polar_ctx: CanvasRenderingContext2D = this.doors_canvas.nativeElement.getContext('2d');
        this.doors_chart = new Chart<'bar'>(polar_ctx, {
            type: 'bar',
            data: {
                labels: this.completeCitizenList.citizens.map((citizen: Citizen) => citizen.name),
                datasets: this.convertDoorsAccessToDatasets(this.doorsAccessTransformation())
                    .map((doors_access_for_citizen: ([number, number] | null)[], index: number) => {
                        return {
                            label: $localize`Sortie n°${index + 1}`,
                            data: doors_access_for_citizen,
                            borderSkipped: false,
                            minBarLength: 1
                        };
                    })
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: $localize`Activité`
                    },
                    tooltip: {
                        callbacks: {
                            label: (tooltip_item: TooltipItem<'bar'>) => (moment((<number[]>tooltip_item.raw)[0]).format('k:mm').replace('24:00', '0:00') + ' - ' + moment((<number[]>tooltip_item.raw)[1]).format('k:mm').replace('24:00', '0:00')),
                        },
                        position: 'nearest'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            source: 'labels',
                            callback: (val: string | number): string => {
                                return moment(val).format('k:mm').replace('24:00', '0:00');
                            }
                        },
                        afterBuildTicks: (axis: Scale): { value: number; }[] => {
                            const ticks: string[] = ['0:00', '2:00', '4:00', '6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:59'];

                            return axis.ticks = ticks.map((v: string): { value: number } => ({ value: +moment(v, 'k:m').format('x') }));
                        },
                        stacked: false,
                        min: +moment('0:00', 'k:mm').format('x'),
                        max: +moment('23:59', 'k:mm').format('x')
                    },
                    y: {
                        stacked: true,
                    },
                },
            }
        });
    }

    private doorsAccessTransformation(): DoorsAccessPerCitizen[] {
        return this.completeCitizenList.citizens.map((citizen: Citizen): DoorsAccessPerCitizen => {
            const entries_for_citizen: Entry[] = this.entries
                .filter((entry: Entry): boolean => entry.entry?.indexOf(citizen.name) > -1)
                .reverse();
            const entries_by_binome: [number, number][] = [];
            for (let i: number = 0; i < entries_for_citizen.length; i++) {
                let binome: [number, number];
                const entry_for_citizen: Entry = entries_for_citizen[i];
                const is_entering: boolean = this.doors_entering_keywords.some((doors_entering: string): boolean => entry_for_citizen.entry?.indexOf(' ' + doors_entering) > -1);

                if (i === 0 && is_entering) {
                    binome = [+moment('0:00', 'k:mm').format('x'), +moment(entry_for_citizen.hour, 'k:mm').format('x')];
                } else if (i === entries_for_citizen.length - 1 && !is_entering) {
                    binome = [+moment(entry_for_citizen.hour, 'k:mm').format('x'), +moment('23:59', 'k:mm').format('x')];
                } else {
                    binome = [+moment(entry_for_citizen.hour, 'k:mm').format('x'), +moment(entries_for_citizen[i + 1].hour, 'k:mm').format('x')];
                    i++;
                }
                entries_by_binome.push(binome);
            }

            return {
                citizen: citizen,
                entries: entries_by_binome
            };
        });
    }

    private convertDoorsAccessToDatasets(doors_access_per_citizen: DoorsAccessPerCitizen[]): ([number, number] | null)[][] {
        let most_entries: number = 0;
        doors_access_per_citizen.forEach((access_per_citizen: DoorsAccessPerCitizen) => {
            if (access_per_citizen.entries.length > most_entries) {
                most_entries = access_per_citizen.entries.length;
            }
        });

        const datasets: ([number, number] | null)[][] = [];

        for (let i: number = 0; i < most_entries; i++) {
            const citizen_entry: ([number, number] | null)[] = [];
            doors_access_per_citizen.forEach((access_per_citizen: DoorsAccessPerCitizen) => {
                if (access_per_citizen.entries[i]) {
                    citizen_entry.push(access_per_citizen.entries[i]);
                } else {
                    citizen_entry.push(null);
                }
            });
            datasets.push(citizen_entry);
        }

        return datasets;

    }
}

interface DoorsAccessPerCitizen {
    citizen: Citizen;
    entries: [number, number][];
}

