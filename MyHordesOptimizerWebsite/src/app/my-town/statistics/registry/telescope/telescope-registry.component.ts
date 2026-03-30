import { CommonModule } from '@angular/common';
import { Component, computed, input, Input, InputSignal, Signal, ViewEncapsulation } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { entryHasKeyword } from '../../../../_core/utilities/registry.util';
import { CitizenInfoComponent } from '../../../../_shared/citizen-info/citizen-info.component';
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
    public completeItemsList: InputSignal<Item[]> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry.filter((entry: Entry) => {
                return Object.values(this.telescope_item()?.label).some((label: string): boolean => entryHasKeyword(entry, label));
            });
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];

    private readonly telescope_item: Signal<Item> = computed(() => this.completeItemsList()?.find((item: Item) => item.img.indexOf('item_scope') > -1) as Item);

}


