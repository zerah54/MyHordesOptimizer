import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { Imports } from '../../../../../_abstract_model/types/_types';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../../_abstract_model/types/dig.class';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { getTown } from '../../../../../shared/utilities/localstorage.util';
import { DigsPerDayPipe } from './digs-per-day.pipe';
import { NotInListCitizenDigPipe } from './not-in-list-citizen.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [HeaderWithNumberPreviousNextFilterComponent];
const pipes: Imports = [DigsPerDayPipe, NotInListCitizenDigPipe];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule];

@Component({
    selector: 'mho-map-update-digs',
    templateUrl: './map-update-digs.component.html',
    styleUrls: ['./map-update-digs.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateDigsComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() allCitizens!: Citizen[];
    @Input() digs!: Dig[];

    @Output() digsChange: EventEmitter<Dig[]> = new EventEmitter();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    public readonly current_day: number = getTown()?.day || 1;
    public selected_day: number = this.current_day;

    public addCitizen(citizen: Citizen): void {
        const new_dig: Dig = new Dig();
        new_dig.digger_name = citizen.name;
        new_dig.digger_id = citizen.id;
        new_dig.x = this.cell.displayed_x;
        new_dig.y = this.cell.displayed_y;
        new_dig.day = this.selected_day;
        new_dig.nb_success = 0;
        new_dig.nb_total_dig = 0;
        this.digs.push(new_dig);
        this.digs = [...this.digs];
        this.digsChange.emit(this.digs);
    }

    public removeCitizen(citizen_id: number): void {
        const citizen_digs_index: number = this.digs.findIndex((dig: Dig) => dig.digger_id === citizen_id);
        if (citizen_digs_index > -1) {
            this.digs.splice(citizen_digs_index, 1);
            this.digs = [...this.digs];
            this.digsChange.emit(this.digs);
        }
    }
}

