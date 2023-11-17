import { Component, HostBinding, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../../_abstract_model/services/api.service';
import { DigsService } from '../../../../_abstract_model/services/digs.service';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { AutoDestroy } from '../../../../shared/decorators/autodestroy.decorator';

@Component({
    selector: 'mho-map-update',
    templateUrl: './map-update.component.html',
    styleUrls: ['./map-update.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MapUpdateComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La cellule potentiellement modifiée */
    public cell: Cell;
    public digs!: Dig[];

    public readonly locale: string = moment.locale();

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(@Inject(MAT_DIALOG_DATA) public data: MapUpdateData, private api: ApiService, private digs_services: DigsService) {
        this.cell = new Cell({ ...this.data.cell.modelToDto() });
    }

    public ngOnInit(): void {
        this.digs_services.getDigs()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((digs: Dig[]): void => {
                this.digs = digs.filter((dig: Dig) => dig.x === this.cell.displayed_x && dig.y === this.cell.displayed_y);
            });
    }

    saveCell(): void {
        this.api.saveCell(this.cell)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((): void => {
                this.data.cell = new Cell({ ...this.cell.modelToDto() });
            });
        this.digs_services.updateDig(this.digs)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe();
    }
}

export interface MapUpdateData {
    cell: Cell;
    ruin?: Ruin;
    all_citizens: Citizen[];
    all_ruins: Ruin[];
}
