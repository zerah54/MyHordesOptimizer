import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { HeroicActionEnum } from '../../../../../_abstract_model/enum/heroic-action.enum';
import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';

@Component({
    selector: 'mho-map-update-citizens',
    templateUrl: './map-update-citizens.component.html',
    styleUrls: ['./map-update-citizens.component.scss']
})
export class MapUpdateCitizensComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() citizens!: Citizen[];
    @Input() allCitizens!: Citizen[];

    @Output() citizensChange: EventEmitter<Citizen[]> = new EventEmitter();

    public heroics: HeroicActionEnum[] = HeroicActionEnum.getAllValues();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    addCitizen(citizen: Citizen): void {
        this.citizens.push(citizen);
        this.citizens.sort((citizen_a: Citizen, citizen_b: Citizen) => citizen_a.name.toLocaleLowerCase().localeCompare(citizen_b.name.toLocaleLowerCase()));

        this.citizensChange.next(this.citizens);
    }

}

