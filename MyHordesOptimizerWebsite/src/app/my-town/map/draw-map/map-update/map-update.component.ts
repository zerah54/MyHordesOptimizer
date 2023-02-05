import { Component, HostBinding, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
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

    public cell: Cell;

    public readonly locale: string = moment.locale();

    constructor(@Inject(MAT_DIALOG_DATA) public data: MapUpdateData) {
        this.cell = this.data.cell;
    }
}

interface MapUpdateData {
    cell: Cell;
    ruin?: Ruin;
    citizens: Citizen[]
}
