import { CommonModule, NgOptimizedImage } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { CitizensFromShortPipe } from '../../../../_core/pipes/citizens-from-short.pipe';
import { ItemDetailsPipe } from '../../../../_core/pipes/item-details.pipe';
import { ItemImgPipe } from '../../../../_core/pipes/item-img.pipe';
import { CitizenInfoComponent } from '../../../../_shared/citizen-info/citizen-info.component';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { LastUpdateComponent } from '../../../../_shared/last-update/last-update.component';
import { CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe } from './cell-details-position.pipe';
import { RuinInCell } from './ruin-in-cell.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [LastUpdateComponent, IconApComponent, CitizenInfoComponent];
const pipes: Imports = [CellDetailsBottomPipe, CellDetailsLeftPipe, CellDetailsRightPipe, CellDetailsTopPipe, CitizensFromShortPipe, ItemImgPipe, ItemDetailsPipe, RuinInCell];
const material_modules: Imports = [MatButtonModule, MatDividerModule, MatIconModule];

@Component({
    selector: 'mho-map-cell-details',
    templateUrl: './map-cell-details.component.html',
    styleUrls: ['./map-cell-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapCellDetailsComponent {

    public cell: InputSignal<Cell> = input.required();
    public cellHtml: InputSignal<HTMLElement> = input.required();
    public allRuins: InputSignal<Ruin[]> = input.required();
    public allCitizens: InputSignal<Citizen[]> = input.required();
    public allItems: InputSignal<Item[]> = input.required();
    /** Mode observateur : la zone reste consultable, mais elle n'est pas modifiable. */
    public canUpdate: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    public updateRequested: OutputEmitterRef<void> = output();
    public closed: OutputEmitterRef<void> = output();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();

}
