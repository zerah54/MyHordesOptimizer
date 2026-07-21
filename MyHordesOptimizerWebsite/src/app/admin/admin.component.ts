import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Imports } from '../_abstract_model/types/_types';

const angular_common: Imports = [RouterLink, RouterLinkActive, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatTabsModule];

@Component({
    selector: 'mho-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AdminComponent {

    protected readonly links: Link[] = [
        {
            label: $localize`Logs`,
            link: 'logs'
        },
        {
            label: $localize`Import données jeu`,
            link: 'data-import'
        },
        {
            label: $localize`Villes`,
            link: 'towns'
        }
    ];

}

interface Link {
    label: string;
    link: string;
}
