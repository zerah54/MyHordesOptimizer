import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';

@Component({
    selector: 'mho-map-update-ruin',
    templateUrl: './map-update-ruin.component.html',
    styleUrls: ['./map-update-ruin.component.scss']
})
export class MapUpdateRuinComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() ruin!: Ruin;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

}

