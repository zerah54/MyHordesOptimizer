import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';

@Component({
    selector: 'mho-registry-bank-diff',
    templateUrl: './bank-diff-registry.component.html',
    styleUrls: ['./bank-diff-registry.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BankDiffRegistryComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({ required: true }) completeCitizenList!: CitizenInfo;
    @Input({ required: true }) completeItemsList!: Item[];

    @Input({ required: true }) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry.filter((entry: Entry) => {
                return this.give_keywords.some((give_keyword: string): boolean => entry.entry?.indexOf(' ' + give_keyword + ' ') > -1 || entry.entry?.indexOf(' ' + give_keyword + ':') > -1)
                    || this.take_keywords.some((take_keyword: string): boolean => entry.entry?.indexOf(' ' + take_keyword + ' ') > -1 || entry.entry?.indexOf(' ' + take_keyword + ':') > -1);
            });
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];

    /** La locale */
    protected readonly locale: string = moment.locale();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    protected readonly give_keywords: string[] = [
        'a donné', 'folgendes gespendet', 'has given', 'ha donado',
        'cabot malodorant', 'stinkende Köter', 'foul-smelling dog', 'el perro maloliente'
    ];
    protected readonly take_keywords: string[] = [
        'a pris', 'Gegenstand aus der Bank genommen', 'has taken', 'ha cogito',
    ];
}


