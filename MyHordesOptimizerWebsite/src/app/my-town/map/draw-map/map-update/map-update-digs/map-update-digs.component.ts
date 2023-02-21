import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { getTown } from 'src/app/shared/utilities/localstorage.util';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Dig } from 'src/app/_abstract_model/types/dig.class';

@Component({
    selector: 'mho-map-update-digs',
    templateUrl: './map-update-digs.component.html',
    styleUrls: ['./map-update-digs.component.scss']
})
export class MapUpdateDigsComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() allCitizens!: Citizen[];
    @Input() digs!: Dig[];

    @Output() digsChange: EventEmitter<Dig[]> = new EventEmitter();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    public current_day: number = getTown()?.day || 1;
    public selected_day: number = this.current_day;

    public addCitizen(citizen: Citizen): void {
        let new_dig: Dig = new Dig();
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
        let citizen_digs_index: number = this.digs.findIndex((dig: Dig) => dig.digger_id === citizen_id);
        if (citizen_digs_index > -1) {
            this.digs.splice(citizen_digs_index, 1);
            this.digs = [...this.digs];
            this.digsChange.emit(this.digs);
        }
    }
}

