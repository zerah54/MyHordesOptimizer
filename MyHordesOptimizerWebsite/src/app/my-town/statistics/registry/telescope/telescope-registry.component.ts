import { CommonModule } from '@angular/common';
import { Component, input, Input, InputSignal, ViewEncapsulation } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { CitizenInfoComponent } from '../../../../shared/elements/citizen-info/citizen-info.component';
import { TelescopePipe } from './telescope.pipe';

const angular_common: Imports = [CommonModule];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [TelescopePipe];
const material_modules: Imports = [MatDividerModule];

@Component({
    selector: 'mho-registry-telescope',
    templateUrl: './telescope-registry.component.html',
    styleUrls: ['./telescope-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class TelescopeRegistryComponent {

    public completeCitizenList: InputSignal<CitizenInfo> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry.filter((entry: Entry) => {
                return this.telescope_keywords.some((telescope_keyword: string): boolean => entry.entry?.indexOf(telescope_keyword) > -1);
            });
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];

    private readonly telescope_keywords: string[] = [
        'Téléscope', 'Teleskop', 'Telescope', 'Telescopio',
    ];

}


