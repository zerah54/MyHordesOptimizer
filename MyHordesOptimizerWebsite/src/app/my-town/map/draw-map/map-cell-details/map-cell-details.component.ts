import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { CitizenInfoComponent } from '../../../../shared/elements/citizen-info/citizen-info.component';
import { IconApComponent } from '../../../../shared/elements/icon-ap/icon-ap.component';
import { LastUpdateComponent } from '../../../../shared/elements/last-update/last-update.component';
import { CitizensFromShortPipe } from '../../../../shared/pipes/citizens-from-short.pipe';
import { ItemDetailsPipe } from '../../../../shared/pipes/item-details.pipe';
import { CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe } from './cell-details-position.pipe';
import { RuinInCell } from './ruin-in-cell.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [LastUpdateComponent, IconApComponent, CitizenInfoComponent];
const pipes: Imports = [CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe, CitizensFromShortPipe, ItemDetailsPipe, RuinInCell];
const material_modules: Imports = [MatDividerModule];

@Component({
    selector: 'mho-map-cell-details',
    templateUrl: './map-cell-details.component.html',
    styleUrls: ['./map-cell-details.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapCellDetailsComponent {

    public cell: InputSignal<Cell> = input.required();
    public cellHtml: InputSignal<HTMLTableCellElement> = input.required();
    public allRuins: InputSignal<Ruin[]> = input.required();
    public allCitizens: InputSignal<Citizen[]> = input.required();
    public allItems: InputSignal<Item[]> = input.required();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

}
