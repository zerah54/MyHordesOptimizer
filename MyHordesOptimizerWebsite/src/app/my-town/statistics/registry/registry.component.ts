import { Component, HostBinding, OnInit, ViewEncapsulation } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Entry } from '../../../_abstract_model/interfaces';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Item } from '../../../_abstract_model/types/item.class';
import * as moment from 'moment/moment';

@Component({
    selector: 'mho-registry',
    templateUrl: './registry.component.html',
    styleUrls: ['./registry.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RegistryComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public dev_mode: boolean = !environment.production;

    public registry!: string;
    public display_mode!: RegistryMode;
    public entries!: Entry[];

    public complete_citizen_list!: CitizenInfo;
    public complete_items_list!: Item[];

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    public readonly give_keywords: string[] = ['a donné', 'folgendes gespendet', 'has given', 'ha donado'];
    public readonly take_keywords: string[] = ['a pris', 'Gegenstand aus der Bank genommen', 'has taken', 'ha cogito'];

    private readonly well_keywords: string[] = [
        'a pris une ration', 'hat eine Ration Wasser genommen', 'has taken a ration', 'ha tomado una ración',
        's\'est permis de prendre plus d\'eau', 'hat mehr Wasser genommen', 'has decided it was ok for them to take more water', 'se ha dado el lujo de tomar más agua',
    ];
    private readonly dice_keywords: string[] = ['Dés', 'Ein paar Würfel', 'Dice', 'Dados'];
    private readonly cards_keywords: string[] = ['Jeu de cartes incomplet', 'Unvollständiges Kartenspiel', 'Incomplete Deck of Cards', 'Juego de cartas incompleto'];

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
                const entry_split: string[] = entry.split(' [X] ');
                return {
                    hour: entry_split[0],
                    entry: entry_split[1]
                };
            });
            this.display_mode = display_mode;

            switch (display_mode) {
                case 'dice':
                    this.entries = entries.filter((entry: Entry) => {
                        return this.dice_keywords.some((dice_keyword: string): boolean => entry.entry?.indexOf(' ' + dice_keyword + ' ') > -1);
                    });
                    break;
                case 'card':
                    this.entries = entries.filter((entry: Entry) => {
                        return this.cards_keywords.some((dice_keyword: string): boolean => entry.entry?.indexOf(' ' + dice_keyword + ' ') > -1);
                    });
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
                case 'digs':
                default:
                    break;
            }
            console.log('entries', this.entries);
        }
    }
}

type RegistryMode = 'dice' | 'card' | 'digs' | 'bank_diff' | 'well'
