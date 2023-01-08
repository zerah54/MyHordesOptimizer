import { Component, HostBinding, Input } from '@angular/core';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import * as moment from 'moment';
import { Moment } from 'moment';
@Component({
    selector: 'mho-last-update',
    templateUrl: './last-update.component.html',
    styleUrls: ['./last-update.component.scss']
})
export class LastUpdateComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() lastUpdateInfo!: UpdateInfo;
    @Input() thresholds!: [number, number, number, number];
    @Input() hideDetails: boolean = false;

    public moment: typeof moment = moment;

}

