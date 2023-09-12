import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss']
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
