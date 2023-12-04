import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss'],
    standalone: true,
    imports: [MatCardModule, MatTabsModule, CommonModule, RouterLink, RouterOutlet]
})
export class CitizensComponent {
    @HostBinding('style.display') display: string = 'contents';

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
