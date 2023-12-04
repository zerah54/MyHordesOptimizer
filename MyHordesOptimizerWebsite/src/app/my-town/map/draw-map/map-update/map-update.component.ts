import { CommonModule } from '@angular/common';
import { Component, HostBinding, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../../_abstract_model/services/api.service';
import { DigsService } from '../../../../_abstract_model/services/digs.service';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { AutoDestroy } from '../../../../shared/decorators/autodestroy.decorator';
import { CitizensFromShortPipe } from '../../../../shared/pipes/citizens-from-short.pipe';
import { MapUpdateCellComponent } from './map-update-cell/map-update-cell.component';
import { MapUpdateCitizensComponent } from './map-update-citizens/map-update-citizens.component';
import { MapUpdateDigsComponent } from './map-update-digs/map-update-digs.component';
import { MapUpdateRuinComponent } from './map-update-ruin/map-update-ruin.component';

@Component({
    selector: 'mho-map-update',
    templateUrl: './map-update.component.html',
    styleUrls: ['./map-update.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatDialogTitle, CommonModule, MatButtonModule, MatDialogClose, MatIconModule, MatDialogContent, MatTabsModule, MapUpdateCellComponent, MapUpdateRuinComponent, MapUpdateCitizensComponent, MatFormFieldModule, MatInputModule, FormsModule, MapUpdateDigsComponent, MatDialogActions, CitizensFromShortPipe]
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
