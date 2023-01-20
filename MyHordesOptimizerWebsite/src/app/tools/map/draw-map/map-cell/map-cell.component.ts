import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import { MapOptions } from '../../map.component';

@Component({
  selector: 'mho-map-cell',
  templateUrl: './map-cell.component.html',
  styleUrls: ['./map-cell.component.scss', '../draw-map.component.scss']
})
export class MapCellComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() drawedMap!: Cell[][];
    @Input() allRuins!: Ruin[];
    @Input() allItems!: Item[];
    @Input() options!: MapOptions;

    public readonly locale: string = moment.locale();
}
