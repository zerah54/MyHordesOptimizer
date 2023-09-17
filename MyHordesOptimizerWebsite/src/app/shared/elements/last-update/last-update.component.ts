import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';

@Component({
    selector: 'mho-last-update',
    templateUrl: './last-update.component.html',
    styleUrls: ['./last-update.component.scss']
})
export class LastUpdateComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() lastUpdateInfo: UpdateInfo | undefined;
    @Input() thresholds!: [number, number, number, number];
    @Input() hideDetails: boolean = false;

    public moment: moment.Moment = moment();

}

