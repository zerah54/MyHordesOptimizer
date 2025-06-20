import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { CitizenInfoComponent } from '../../../../shared/elements/citizen-info/citizen-info.component';
import { BankCleanEntriesPipe, BankDiffPipe } from './bank-gift.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [BankCleanEntriesPipe, BankDiffPipe];
const material_modules: Imports = [MatSlideToggleModule];

@Component({
    selector: 'mho-registry-bank-diff',
    templateUrl: './bank-diff-registry.component.html',
    styleUrls: ['./bank-diff-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class BankDiffRegistryComponent {

    @Input({required: true}) completeCitizenList!: CitizenInfo;
    @Input({required: true}) displayPseudo!: DisplayPseudoMode;
    @Input({required: true}) completeItemsList!: Item[];

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
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


