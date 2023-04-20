import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { MapOptions } from '../../map.component';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';

@Component({
    selector: 'mho-map-cell-details',
    templateUrl: './map-cell-details.component.html',
    styleUrls: ['./map-cell-details.component.scss']
})
export class MapCellDetailsComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() cellHtml!: HTMLTableCellElement;
    @Input() allRuins!: Ruin[];
    @Input() allCitizens!: Citizen[];
    @Input() allItems!: Item[];
    @Input() options!: MapOptions;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

}
