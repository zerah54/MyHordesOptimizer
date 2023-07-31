import {Component, ElementRef, HostBinding, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {ApiServices} from '../../../_abstract_model/services/api.services';
import {CitizenInfo} from '../../../_abstract_model/types/citizen-info.class';
import {Entry} from '../../../_abstract_model/interfaces';
import {HORDES_IMG_REPO} from '../../../_abstract_model/const';
import {Item} from '../../../_abstract_model/types/item.class';
import * as moment from 'moment/moment';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {Citizen} from '../../../_abstract_model/types/citizen.class';
import Chart from 'chart.js/auto';
import {Scale, TooltipItem} from 'chart.js';

@Component({
    selector: 'mho-registry',
    templateUrl: './registry.component.html',
    styleUrls: ['./registry.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RegistryComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('doorsCanvas') doors_canvas!: ElementRef;

    public dev_mode: boolean = !environment.production;

    public registry!: string;
    public display_mode!: RegistryMode;
    public entries!: Entry[];

    public complete_citizen_list!: CitizenInfo;
    public complete_items_list!: Item[];
    public play_type!: PlayType;
    public doors_chart!: Chart<'bar'>;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    public readonly give_keywords: string[] = ['a donné', 'folgendes gespendet', 'has given', 'ha donado'];
    public readonly take_keywords: string[] = ['a pris', 'Gegenstand aus der Bank genommen', 'has taken', 'ha cogito'];

    private readonly well_keywords: string[] = [
        'a pris une ration', 'hat eine Ration Wasser genommen', 'has taken a ration', 'ha tomado una ración',
        's\'est permis de prendre plus d\'eau', 'hat mehr Wasser genommen', 'has decided it was ok for them to take more water', 'se ha dado el lujo de tomar más agua',
    ];
    private readonly dices_keywords: string[] = ['Dés', 'Ein paar Würfel', 'Dice', 'Dados'];
    private readonly cards_keywords: string[] = ['Jeu de cartes incomplet', 'Unvollständiges Kartenspiel', 'Incomplete Deck of Cards', 'Juego de cartas incompleto'];
    private readonly doors_leaving_keywords: string[] = ['a quitté la ville', 'left', 'verlassen', 'ha salido del'];
    private readonly doors_entering_keywords: string[] = ['est de retour en ville', 'entered', 'betreten', 'está de vuelta en el'];

    constructor(private api: ApiServices) {

    }

    public ngOnInit(): void {
        this.api.getCitizens().subscribe((citizen: CitizenInfo): void => {
            this.complete_citizen_list = citizen;
        });
        this.api.getItems().subscribe((items: Item[]): void => {
            this.complete_items_list = items;
        });
    }

    public readLogs(display_mode: RegistryMode): void {
        this.entries = [];
        if (this.registry) {
            const entries: Entry[] = this.registry.split('\n').map((entry: string): Entry => {
                const entry_split: string[] = entry.split('[X] ');
                return {
                    hour: entry_split[0],
                    entry: entry_split[1]
                };
            });

            this.display_mode = display_mode;

            switch (display_mode) {
                case 'plays':
                    if (this.play_type === 'card') {
                        this.entries = entries.filter((entry: Entry) => {
                            return this.cards_keywords.some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
                        });
                    } else if (this.play_type === 'dice') {
                        this.entries = entries.filter((entry: Entry) => {
                            return this.dices_keywords.some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
                        });
                    } else {
                        const card_entries: Entry[] = entries.filter((entry: Entry) => {
                            return this.cards_keywords.some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
                        });
                        const dice_entries: Entry[] = entries.filter((entry: Entry) => {
                            return this.dices_keywords.some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
                        });
                        this.entries = entries.filter((entry: Entry) => {
                            const is_card_keyword: boolean = this.cards_keywords
                                .some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
                            const is_dice_keyword: boolean = this.dices_keywords
                                .some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
                            const citizen: Citizen | undefined = this.complete_citizen_list.citizens
                                .find((citizen: Citizen): boolean => entry.entry?.indexOf(citizen.name) > -1);
                            let has_pendant: boolean;
                            if (is_dice_keyword) {
                                has_pendant = card_entries.some((cards_entry: Entry): boolean => {
                                    const citizen_for_entry: Citizen | undefined = this.complete_citizen_list.citizens
                                        .find((citizen: Citizen): boolean => cards_entry.entry?.indexOf(citizen.name) > -1);
                                    return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                                });
                            } else if (is_card_keyword) {
                                has_pendant = dice_entries.some((dice_entry: Entry): boolean => {
                                    const citizen_for_entry: Citizen | undefined = this.complete_citizen_list.citizens
                                        .find((citizen: Citizen): boolean => dice_entry.entry?.indexOf(citizen.name) > -1);
                                    return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                                });
                            } else {
                                has_pendant = false;
                            }
                            return (is_dice_keyword || is_card_keyword) && has_pendant;
                        });
                        console.log('this.entries', this.entries);
                    }
                    break;
                case 'bank_diff':
                    this.entries = entries.filter((entry: Entry) => {
                        return this.give_keywords.some((give_keyword: string): boolean => entry.entry?.indexOf(' ' + give_keyword + ' ') > -1 || entry.entry?.indexOf(' ' + give_keyword + ':') > -1)
                            || this.take_keywords.some((take_keyword: string): boolean => entry.entry?.indexOf(' ' + take_keyword + ' ') > -1 || entry.entry?.indexOf(' ' + take_keyword + ':') > -1);
                    });
                    break;
                case 'well':
                    this.entries = entries.filter((entry: Entry) => {
                        return this.well_keywords.some((well_keywords: string): boolean => entry.entry?.indexOf(' ' + well_keywords + ' ') > -1);
                    });
                    break;
                case 'doors':
                    this.entries = entries.filter((entry: Entry) => {
                        return this.doors_entering_keywords.some((doors_entering: string): boolean => entry.entry?.indexOf(' ' + doors_entering) > -1)
                            || this.doors_leaving_keywords.some((doors_leaving: string): boolean => entry.entry?.indexOf(' ' + doors_leaving) > -1);
                    });
                    setTimeout(() => {
                        this.createDoorsCanvas();
                    });
                    break;
                case 'digs':
                default:
                    break;
            }
        }
    }

    public entryHasPlayKeyword(entry: Entry, keyword: string): boolean {
        return entry.entry?.indexOf(' ' + keyword + ' ') > -1;
    }

    public changePlaysTab(event: MatTabChangeEvent): void {
        this.play_type = <PlayType>event.tab.labelClass;
        setTimeout(() => {
            this.readLogs('plays');
        });
    }

    public createDoorsCanvas(): void {
        const polar_ctx: CanvasRenderingContext2D = this.doors_canvas.nativeElement.getContext('2d');
        this.doors_chart = new Chart<'bar'>(polar_ctx, {
            type: 'bar',
            data: {
                labels: this.complete_citizen_list.citizens.map((citizen: Citizen) => citizen.name),
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
                                console.log('val', val);
                                return moment(val).format('k:mm').replace('24:00', '0:00');
                            }
                        },
                        afterBuildTicks: (axis: Scale): { value: number; }[] => {
                            const ticks: string[] = ['0:00', '2:00', '4:00', '6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:59'];

                            return axis.ticks = ticks.map((v: string): { value: number } => ({value: +moment(v, 'k:m').format('x')}));
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
        return this.complete_citizen_list.citizens.map((citizen: Citizen): DoorsAccessPerCitizen => {
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

type RegistryMode = 'dice' | 'card' | 'digs' | 'bank_diff' | 'well' | 'plays' | 'doors';
type PlayType = 'dice' | 'card' | 'plays';


interface DoorsAccessPerCitizen {
    citizen: Citizen;
    entries: [number, number][];
}
