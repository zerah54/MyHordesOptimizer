import { Component, HostBinding, OnInit, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment/moment';
import { environment } from '../../../../environments/environment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Entry } from '../../../_abstract_model/interfaces';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../_abstract_model/types/item.class';

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
    public registry_entries!: Entry[];
    public display_mode!: RegistryMode;

    public complete_citizen_list!: CitizenInfo;
    public complete_items_list!: Item[];

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();


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
        if (this.registry) {
            this.registry_entries = this.registry.split('\n')
                .map((entry: string): Entry => {
                    const entry_split: string[] = entry.split('[X] ');
                    return {
                        hour: entry_split[0],
                        entry: entry_split[1]
                    };
                })
                .filter((entry: Entry) => entry.entry !== undefined && entry.entry !== null && entry.entry !== '');

            this.display_mode = display_mode;
        } else {
            this.registry = '';
        }
    }

}

type RegistryMode = 'dice' | 'card' | 'digs' | 'bank_diff' | 'well' | 'plays' | 'doors';
