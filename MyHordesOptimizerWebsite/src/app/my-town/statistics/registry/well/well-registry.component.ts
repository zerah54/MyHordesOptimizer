import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { CitizenInfoComponent } from '../../../../_shared/citizen-info/citizen-info.component';
import { WellPipe } from './well.pipe';

const angular_common: Imports = [CommonModule];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [WellPipe];
const material_modules: Imports = [MatDividerModule];

@Component({
    selector: 'mho-registry-well',
    templateUrl: './well-registry.component.html',
    styleUrls: ['./well-registry.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WellRegistryComponent {

    public completeCitizenList: InputSignal<CitizenInfo> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();
    public registry: InputSignal<Entry[] | undefined> = input.required();

    protected readonly entries: Signal<Entry[]> = computed((): Entry[] => {
        const registry: Entry[] | undefined = this.registry();
        if (!registry) {
            return [];
        }
        return registry.filter((entry: Entry) => {
            return this.well_keywords.some((well_keywords: string): boolean => entry.entry?.indexOf(' ' + well_keywords + ' ') > -1);
        });
    });

    private readonly well_keywords: string[] = [
        'a pris une ration', 'hat eine Ration Wasser genommen', 'has taken a ration', 'ha tomado una ración',
        'permis de prendre plus', 'hat mehr Wasser genommen', 'has decided it was ok for them to take more water', 'se ha dado el lujo de tomar más agua',
    ];

}


