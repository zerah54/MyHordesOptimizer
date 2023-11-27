import { DatePipe, NgFor, NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as moment from 'moment';
import { Moment } from 'moment';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';

@Component({
    selector: 'mho-last-update',
    templateUrl: './last-update.component.html',
    styleUrls: ['./last-update.component.scss'],
    standalone: true,
    imports: [NgIf, NgFor, NgTemplateOutlet, NgOptimizedImage, MatTooltipModule, DatePipe]
})
export class LastUpdateComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() lastUpdateInfo: UpdateInfo | undefined;
    @Input() thresholds!: [number, number, number, number];
    @Input() hideDetails: boolean = false;

    public moment: Moment = moment();

}

