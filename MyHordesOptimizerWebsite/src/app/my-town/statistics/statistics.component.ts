import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'mho-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent {
    @HostBinding('style.display') display: string = 'contents';

    public links: Link[] = [
        {
            label: $localize`Estimations`,
            link: '/my-town/stats/estimations'
        },
        {
            label: $localize`Scrutateur`,
            link: '/my-town/stats/scrutateur'
        },
        {
            label: $localize`Registre`,
            link: '/my-town/stats/registry'
        }
    ];

    constructor(protected router: Router) {
    }

}


interface Link {
    label: string;
    link: string;
}
