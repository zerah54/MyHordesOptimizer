import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { IconApComponent } from '../../../../shared/elements/icon-ap/icon-ap.component';
import { LastUpdateComponent } from '../../../../shared/elements/last-update/last-update.component';
import { CitizensFromShortPipe } from '../../../../shared/pipes/citizens-from-short.pipe';
import { ItemDetailsPipe } from '../../../../shared/pipes/item-details.pipe';
import { MapOptions } from '../../map.component';
import { CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe } from './cell-details-position.pipe';
import { RuinInCell } from './ruin-in-cell.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [LastUpdateComponent, IconApComponent];
const pipes: Imports = [CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe, CitizensFromShortPipe, ItemDetailsPipe, RuinInCell];
const material_modules: Imports = [MatDividerModule];

@Component({
    selector: 'mho-map-cell-details',
    templateUrl: './map-cell-details.component.html',
    styleUrls: ['./map-cell-details.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
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
