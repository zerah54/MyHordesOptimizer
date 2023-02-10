import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import { environment } from 'src/environments/environment';
import { MapOptions } from '../../map.component';
import { MapUpdateComponent, MapUpdateData } from '../map-update/map-update.component';

@Component({
    selector: 'mho-map-cell',
    templateUrl: './map-cell.component.html',
    styleUrls: ['./map-cell.component.scss', '../draw-map.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MapCellComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() drawedMap!: Cell[][];
    @Input() allRuins!: Ruin[];
    @Input() allCitizens!: Citizen[];
    @Input() allItems!: Item[];
    @Input() options!: MapOptions;

    public current_cell?: Cell;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();


    constructor(private dialog: MatDialog) {

    }

    public openCellUpdate(cell: Cell): void {
        console.log('cell', cell);
        if (!environment.production) {
            this.dialog.open(MapUpdateComponent, {
                data: <MapUpdateData>{
                    cell: cell,
                    ruin: cell.ruin_id ? this.allRuins.find((ruin: Ruin) => ruin.id === cell.ruin_id) : undefined,
                    all_ruins: this.allRuins,
                    all_citizens: this.allCitizens
                }
            });
        }
    }
}
