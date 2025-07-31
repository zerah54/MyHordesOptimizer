import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, ViewEncapsulation, InputSignal, input, OutputEmitterRef, output, DestroyRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { MapOptions } from '../../map.component';
import { MapCellDetailsComponent } from '../map-cell-details/map-cell-details.component';
import { MapUpdateComponent, MapUpdateData } from '../map-update/map-update.component';
import { DigLevelPipe } from './pipes/dig-level.pipe';
import { DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop } from './pipes/dist-borders.pipe';
import { IsRuinPipe } from './pipes/is_ruin.pipe';
import { MyCellPipe } from './pipes/my-cell.pipe';
import { ScrutBorderBottom, ScrutBorderLeft, ScrutBorderRight, ScrutBorderTop } from './pipes/scrut-borders.pipe';
import { TrashLevelPipe } from './pipes/trash-level.pipe';
import { TrashValuePipe } from './pipes/trash-value.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, NgClass, NgOptimizedImage];
const components: Imports = [
    DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop,
    MapCellDetailsComponent,
    ScrutBorderBottom, ScrutBorderLeft, ScrutBorderRight, ScrutBorderTop];
const pipes: Imports = [DecimalPipe, DigLevelPipe, IsRuinPipe, MyCellPipe, TrashLevelPipe, TrashValuePipe];
const material_modules: Imports = [];

@Component({
    selector: 'mho-map-cell',
    templateUrl: './map-cell.component.html',
    styleUrls: ['./map-cell.component.scss', '../draw-map.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    animations: [
        trigger('toggleCurrentCell', [
            transition(':enter', [
                style({opacity: 0, display: 'inline'}),
                animate('500ms ease-out', style({opacity: 1}))
            ]),
            transition(':leave', [
                style({opacity: 1, display: 'inline'}),
                animate('500ms ease-in', style({opacity: 0}))
            ])
        ])
    ],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapCellComponent {

    public cell: InputSignal<Cell> = input.required();
    public drawedMap: InputSignal<Cell[][]> = input.required();
    public allRuins: InputSignal<Ruin[]> = input.required();
    public allCitizens: InputSignal<Citizen[]> = input.required();
    public allItems: InputSignal<Item[]> = input.required();
    public options: InputSignal<MapOptions> = input.required();

    public cellChange: OutputEmitterRef<Cell> = output();
    public currentHoveredCellChange: OutputEmitterRef<Cell | undefined> = output();

    public current_cell?: Cell;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    constructor(private dialog: MatDialog) {

    }

    public openCellUpdate(): void {
        this.dialog
            .open(MapUpdateComponent, {
                data: <MapUpdateData>{
                    cell: this.cell(),
                    ruin: this.cell().ruin_id ? this.allRuins().find((ruin: Ruin) => ruin.id === this.cell().ruin_id) : undefined,
                    all_ruins: this.allRuins(),
                    all_citizens: this.allCitizens()
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((new_cell: Cell) => {
                if (new_cell) {
                    this.cellChange.emit(new_cell);
                }
            });
    }

    public changeCurrentCell(cell?: Cell): void {
        this.current_cell = cell;
        this.currentHoveredCellChange.emit(cell);
    }
}
