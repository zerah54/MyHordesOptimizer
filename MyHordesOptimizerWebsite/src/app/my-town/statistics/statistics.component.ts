import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, RouterLink, RouterLinkActive, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatTabsModule];

@Component({
    selector: 'mho-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class StatisticsComponent {

    protected links: Link[] = [
        {
            label: $localize`Estimations`,
            link: 'estimations'
        },
        {
            label: $localize`Scrutateur`,
            link: 'scrutateur'
        },
        {
            label: $localize`Registre`,
            link: 'registry'
        }
    ];

}


interface Link {
    label: string;
    link: string;
}
