import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';

@Component({
    selector: 'mho-registry-well',
    templateUrl: './well-registry.component.html',
    styleUrls: ['./well-registry.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WellRegistryComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({ required: true }) completeCitizenList!: CitizenInfo;

    @Input({ required: true }) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry.filter((entry: Entry) => {
                return this.well_keywords.some((well_keywords: string): boolean => entry.entry?.indexOf(' ' + well_keywords + ' ') > -1);
            });
        } else {
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];

    private readonly well_keywords: string[] = [
        'a pris une ration', 'hat eine Ration Wasser genommen', 'has taken a ration', 'ha tomado una ración',
        's\'est permis de prendre plus d\'eau', 'hat mehr Wasser genommen', 'has decided it was ok for them to take more water', 'se ha dado el lujo de tomar más agua',
    ];

}


