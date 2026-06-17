import { CommonModule } from '@angular/common';
import { Component, computed, input, Input, InputSignal, Signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { entryHasKeyword } from '../../../../_core/utilities/registry.util';
import { CitizenInfoComponent } from '../../../../_shared/citizen-info/citizen-info.component';
import { FlagPipe } from './flag.pipe';

const angular_common: Imports = [CommonModule];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [FlagPipe];
const material_modules: Imports = [MatDividerModule];

@Component({
    selector: 'mho-registry-flag',
    templateUrl: './flag-registry.component.html',
    styleUrls: ['./flag-registry.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class FlagRegistryComponent {

    public completeCitizenList: InputSignal<CitizenInfo> = input.required();
    public completeItemsList: InputSignal<Item[]> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();

    // TODO: Skipped for migration because:
    //  Accessor inputs cannot be migrated as they are too complex.
    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry;
            this.filterEntries(registry);
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];

    private readonly flag_item: Signal<Item> = computed(() => this.completeItemsList()?.find((item: Item) => item.img.indexOf('item_flag') > -1) as Item);

    private filterEntries(entries: Entry[]): void {
        this.entries = entries.filter((entry: Entry) => {
            return Object.values(this.flag_item()?.label).some((label: string): boolean => entryHasKeyword(entry, label));
        });
    }
}


