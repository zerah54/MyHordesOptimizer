import { Component, HostBinding } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'mho-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent {
    @HostBinding('style.display') display: string = 'contents';

    public is_dev: boolean = !environment.production;
}
