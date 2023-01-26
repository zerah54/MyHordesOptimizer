import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import { MapOptions } from '../../map.component';

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

    log(cell: Cell) {
        console.log('cell', cell)
    }
}
