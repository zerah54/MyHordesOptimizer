import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { HeroicActionEnum } from 'src/app/_abstract_model/enum/heroic-action.enum';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';

@Component({
    selector: 'mho-map-update-citizens',
    templateUrl: './map-update-citizens.component.html',
    styleUrls: ['./map-update-citizens.component.scss']
})
export class MapUpdateCitizensComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() citizens!: Citizen[];

    public heroics: HeroicActionEnum[] = HeroicActionEnum.getAllValues();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

}

