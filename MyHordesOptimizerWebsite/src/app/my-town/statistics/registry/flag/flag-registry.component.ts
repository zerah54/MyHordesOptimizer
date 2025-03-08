import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { CitizenInfoComponent } from '../../../../shared/elements/citizen-info/citizen-info.component';
import { FlagPipe } from './flag.pipe';

const angular_common: Imports = [CommonModule];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [FlagPipe];
const material_modules: Imports = [MatDividerModule];

@Component({
    selector: 'mho-registry-flag',
    templateUrl: './flag-registry.component.html',
    styleUrls: ['./flag-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class FlagRegistryComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({required: true}) completeCitizenList!: CitizenInfo;
    @Input({required: true}) displayPseudo!: DisplayPseudoMode;

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry.filter((entry: Entry) => {
                return this.flag_keywords.some((flag_keyword: string): boolean => entry.entry?.indexOf(flag_keyword) > -1);
            });
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];

    private readonly flag_keywords: string[] = [
        'Drapeau', 'Flagge', 'Flag', 'Bandera',
    ];

}


