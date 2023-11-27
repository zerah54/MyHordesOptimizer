import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { HeroicActionEnum } from '../../../../../_abstract_model/enum/heroic-action.enum';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { HasStillHeroicPipe } from './has-still-heroic.pipe';
import { NotInListCitizenPipe } from './not-in-list-citizen.pipe';

@Component({
    selector: 'mho-map-update-citizens',
    templateUrl: './map-update-citizens.component.html',
    styleUrls: ['./map-update-citizens.component.scss'],
    standalone: true,
    imports: [NgIf, MatButtonModule, MatMenuModule, NgFor, NgOptimizedImage, MatIconModule, MatListModule, HasStillHeroicPipe, NotInListCitizenPipe]
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

