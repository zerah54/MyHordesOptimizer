import { Component, HostBinding, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';

@Component({
    selector: 'mho-map-update',
    templateUrl: './map-update.component.html',
    styleUrls: ['./map-update.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MapUpdateComponent {
    @HostBinding('style.display') display: string = 'contents';

    /** La cellule potentiellement modifiée */
    public cell: Cell;

    public readonly locale: string = moment.locale();

    constructor(@Inject(MAT_DIALOG_DATA) public data: MapUpdateData, private api: ApiServices) {
        this.cell = new Cell({ ...this.data.cell.modelToDto() });
    }

    saveCell(): void {
        this.api.saveCell(this.cell);
    }
}

export interface MapUpdateData {
    cell: Cell;
    ruin?: Ruin;
    all_citizens: Citizen[];
}
