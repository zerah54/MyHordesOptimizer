import { Component, EventEmitter, HostBinding, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { MapOptions } from '../../map.component';
import { MapUpdateComponent, MapUpdateData } from '../map-update/map-update.component';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { AutoDestroy } from '../../../../shared/decorators/autodestroy.decorator';
import { animate, style, transition, trigger } from '@angular/animations';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'mho-map-cell',
    templateUrl: './map-cell.component.html',
    styleUrls: ['./map-cell.component.scss', '../draw-map.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('toggleCurrentCell',
            [
                transition(':enter',
                    [
                        style({opacity: 0, display: 'inline'}),
                        animate('500ms ease-out', style({opacity: 1}))
                    ]
                ),
                transition(':leave',
                    [
                        style({opacity: 1, display: 'inline'}),
                        animate('500ms ease-in', style({opacity: 0}))
                    ]
                )
            ]
        )
    ]
})
export class MapCellComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() drawedMap!: Cell[][];
    @Input() allRuins!: Ruin[];
    @Input() allCitizens!: Citizen[];
    @Input() allItems!: Item[];
    @Input() options!: MapOptions;

    @Output() cellChange: EventEmitter<Cell> = new EventEmitter();

    public current_cell?: Cell;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    public readonly is_dev: boolean = !environment.production;

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private dialog: MatDialog) {

    }

    public openCellUpdate(): void {
        console.log('this.cell', this.cell);
        this.dialog
            .open(MapUpdateComponent, {
                data: <MapUpdateData>{
                    cell: this.cell,
                    ruin: this.cell.ruin_id ? this.allRuins.find((ruin: Ruin) => ruin.id === this.cell.ruin_id) : undefined,
                    all_ruins: this.allRuins,
                    all_citizens: this.allCitizens
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((new_cell: Cell) => {
                this.cell = new_cell;
                this.cellChange.next(new_cell);
            });
    }
}
