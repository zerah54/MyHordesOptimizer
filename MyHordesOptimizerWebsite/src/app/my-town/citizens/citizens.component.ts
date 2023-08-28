import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';

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
            link: '/my-town/citizens/list'
        },
        {
            label: $localize`Fouilles`,
            link: '/my-town/citizens/digs'
        }
    ];

    constructor(protected router: Router) {

    }
}

interface Link {
    label: string;
    link: string;
}
