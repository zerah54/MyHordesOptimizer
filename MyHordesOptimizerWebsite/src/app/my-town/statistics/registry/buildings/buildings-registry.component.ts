import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { CitizenInfoComponent } from '../../../../shared/elements/citizen-info/citizen-info.component';
import { IsCitizenInEntriesPipe } from '../is-citizen-in-entries.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [IsCitizenInEntriesPipe];
const material_modules: Imports = [MatTabsModule];

@Component({
    selector: 'mho-registry-buildings',
    templateUrl: './buildings-registry.component.html',
    styleUrls: ['./buildings-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class BuildingsRegistryComponent {

    @Input({required: true}) completeCitizenList!: CitizenInfo;
    @Input({required: true}) displayPseudo!: DisplayPseudoMode;

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry;
            this.filterEntriesByType(registry);
        } else {
            this.entries = [];
        }
    }

    protected entries_by_type: Entry[] = [];
    protected building_type!: BuildingType;

    protected readonly tabs: BuldingTab[] = [
        {
            id: 'dump',
            img: 'building/small_trash.gif',
            label: $localize`Décharge`
        },
        {
            id: 'vet',
            img: 'building/small_pet.gif',
            label: $localize`Clinique`
        }
    ];

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private entries: Entry[] = [];

    private readonly dump_keywords: string[] = ['la décharge', 'in der Müllhalde', 'at the dump', 'el vertedero'];
    private readonly vet_keywords: string[] = ['a attiré', 'in die Stadt gelockt', 'has lured', 'atrajo a'];


    public entryHasPlayKeyword(entry: Entry, keyword: string): boolean {
        return entry.entry?.indexOf(' ' + keyword + ' ') > -1 || entry.entry?.indexOf(' ' + keyword + '.') > -1;
    }

    public changeBuildingTab(event: MatTabChangeEvent): void {
        this.building_type = <BuildingType>event.tab.labelClass;
        setTimeout(() => {
            this.filterEntriesByType(this.entries);
        });
    }

    private filterEntriesByType(entries: Entry[]): void {
        if (this.building_type === 'dump') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return this.dump_keywords.some((dump_keyword: string): boolean => this.entryHasPlayKeyword(entry, dump_keyword));
            });
        } else {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return this.vet_keywords.some((vet_keyword: string): boolean => this.entryHasPlayKeyword(entry, vet_keyword));
            });
        }
    }

}

type BuildingType = 'dump' | 'vet';

interface BuldingTab {
    id: BuildingType;
    label: string;
    img: string;
}
