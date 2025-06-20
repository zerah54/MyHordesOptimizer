import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, RouterLink, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatTabsModule];

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensComponent {

    protected links: Link[] = [
        {
            label: $localize`Citoyens`,
            path: '/my-town/citizens/list',
            displayed: true
        },
        {
            label: $localize`Fouilles`,
            path: '/my-town/citizens/digs',
            displayed: true
        },
        {
            label: $localize`Bains`,
            path: '/my-town/citizens/watch',
            displayed: true
        },
        {
            label: $localize`Immunités`,
            path: '/my-town/citizens/immune',
            displayed: true
        },
        {
            label: $localize`Disponibilités`,
            path: '/my-town/citizens/dispo',
            displayed: !environment.production
        }
    ];

    constructor(protected router: Router) {

    }
}

interface Link {
    label: string;
    path: string;
    displayed: boolean;
}
