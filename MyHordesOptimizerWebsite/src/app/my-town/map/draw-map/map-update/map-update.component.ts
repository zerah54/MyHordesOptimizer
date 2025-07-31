import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import moment from 'moment';
import { DigsService } from '../../../../_abstract_model/services/digs.service';
import { TownService } from '../../../../_abstract_model/services/town.service';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { CitizensFromShortPipe } from '../../../../shared/pipes/citizens-from-short.pipe';
import { MapUpdateCellComponent } from './map-update-cell/map-update-cell.component';
import { MapUpdateCitizensComponent } from './map-update-citizens/map-update-citizens.component';
import { MapUpdateDigsComponent } from './map-update-digs/map-update-digs.component';
import { MapUpdateRuinComponent } from './map-update-ruin/map-update-ruin.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [MapUpdateCellComponent, MapUpdateCitizensComponent, MapUpdateDigsComponent, MapUpdateRuinComponent];
const pipes: Imports = [CitizensFromShortPipe];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTabsModule];

@Component({
    selector: 'mho-map-update',
    templateUrl: './map-update.component.html',
    styleUrls: ['./map-update.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateComponent implements OnInit {

    /** La cellule potentiellement modifiée */
    public cell: Cell;
    public digs!: Dig[];

    public readonly locale: string = moment.locale();

    private readonly digs_service: DigsService = inject(DigsService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    constructor(@Inject(MAT_DIALOG_DATA) public data: MapUpdateData) {
        this.cell = new Cell({...this.data.cell.modelToDto()});
    }

    public ngOnInit(): void {
        this.digs_service
            .getDigs()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (digs: Dig[]): void => {
                    this.digs = digs.filter((dig: Dig) => dig.x === this.cell.displayed_x && dig.y === this.cell.displayed_y);
                }
            });
    }

    saveCell(): void {
        this.town_service
            .saveCell(this.cell)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (): void => {
                    this.data.cell = new Cell({...this.cell.modelToDto()});
                }
            });
        this.digs_service
            .updateDig(this.digs)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe();
    }
}

export interface MapUpdateData {
    cell: Cell;
    ruin?: Ruin;
    all_citizens: Citizen[];
    all_ruins: Ruin[];
}
