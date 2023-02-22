import { Component, HostBinding, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { DigsServices } from 'src/app/_abstract_model/services/digs.service';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Dig } from 'src/app/_abstract_model/types/dig.class';
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
    public digs!: Dig[];

    public readonly locale: string = moment.locale();

    constructor(@Inject(MAT_DIALOG_DATA) public data: MapUpdateData, private api: ApiServices, private digs_services: DigsServices) {
        this.cell = new Cell({ ...this.data.cell.modelToDto() });
    }

    public ngOnInit(): void {
        this.digs_services.getDigs().subscribe((digs: Dig[]) => {
            this.digs = digs.filter((dig: Dig) => dig.x === this.cell.displayed_x && dig.y === this.cell.displayed_y);
        })
    }

    saveCell(): void {
        this.api.saveCell(this.cell).subscribe(() => {
            this.data.cell = new Cell({...this.cell.modelToDto()});
        });
        this.digs_services.updateDig(this.digs).subscribe();
    }
}

export interface MapUpdateData {
    cell: Cell;
    ruin?: Ruin;
    all_citizens: Citizen[];
    all_ruins: Ruin[];
}
