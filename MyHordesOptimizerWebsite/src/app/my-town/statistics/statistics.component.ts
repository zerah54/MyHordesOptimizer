import { NgFor } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'mho-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss'],
    standalone: true,
    imports: [MatCardModule, MatTabsModule, NgFor, RouterLink, RouterOutlet]
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
