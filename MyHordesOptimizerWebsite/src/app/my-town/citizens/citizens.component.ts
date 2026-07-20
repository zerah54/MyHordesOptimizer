import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, RouterLink, RouterLinkActive, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatTabsModule];

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensComponent {

    protected links: Link[] = [
        {
            label: $localize`Citoyens`,
            path: 'list',
            displayed: true
        },
        {
            label: $localize`Fouilles`,
            path: 'digs',
            displayed: true
        },
        {
            label: $localize`Bains`,
            path: 'watch',
            displayed: true
        },
        {
            label: $localize`Immunités`,
            path: 'immune',
            displayed: true
        },
        {
            label: $localize`Disponibilités`,
            path: 'dispo',
            displayed: !environment.production
        }
    ];
}

interface Link {
    label: string;
    path: string;
    displayed: boolean;
}
