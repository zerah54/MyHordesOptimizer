import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'mho-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
