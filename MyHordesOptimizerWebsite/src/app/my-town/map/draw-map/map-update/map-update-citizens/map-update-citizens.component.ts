import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, InputSignal, input, OutputEmitterRef, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { HeroicActionEnum } from '../../../../../_abstract_model/enum/heroic-action.enum';
import { Imports } from '../../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { CitizenInfoComponent } from '../../../../../shared/elements/citizen-info/citizen-info.component';
import { HasStillHeroicPipe } from './has-still-heroic.pipe';
import { NotInListCitizenPipe } from './not-in-list-citizen.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [HasStillHeroicPipe, NotInListCitizenPipe];
const material_modules: Imports = [MatButtonModule, MatIconModule, MatListModule, MatMenuModule];

@Component({
    selector: 'mho-map-update-citizens',
    templateUrl: './map-update-citizens.component.html',
    styleUrls: ['./map-update-citizens.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateCitizensComponent {

    public allCitizens: InputSignal<Citizen[]> = input.required();

    public citizens: InputSignal<Citizen[]> = input.required();
    public citizensChange: OutputEmitterRef<Citizen[]> = output();

    public heroics: HeroicActionEnum[] = HeroicActionEnum.getAllValues();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    addCitizen(citizen: Citizen): void {
        let new_citizens = this.citizens()
        new_citizens.push(citizen);
        new_citizens.sort((citizen_a: Citizen, citizen_b: Citizen) => citizen_a.name.toLocaleLowerCase().localeCompare(citizen_b.name.toLocaleLowerCase()));
        this.citizensChange.emit(new_citizens);
    }

}

