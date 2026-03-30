import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { MatDivider } from '@angular/material/list';
import moment from 'moment/moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { CitizensFromShortPipe } from '../../../../_core/pipes/citizens-from-short.pipe';
import { ItemDetailsPipe } from '../../../../_core/pipes/item-details.pipe';
import { CitizenInfoComponent } from '../../../../_shared/citizen-info/citizen-info.component';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { LastUpdateComponent } from '../../../../_shared/last-update/last-update.component';
import { RuinInCell } from '../map-cell-details/ruin-in-cell.pipe';

@Component({
    selector: 'mho-map-cell-tooltip',
    templateUrl: './map-cell-tooltip.component.html',
    styleUrl: './map-cell-tooltip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CitizensFromShortPipe,
        ItemDetailsPipe,
        MatDivider,
        NgOptimizedImage,
        RuinInCell,
        IconApComponent,
        CitizenInfoComponent,
        LastUpdateComponent,
    ],
})
export class MapCellTooltipComponent {
    public cell: WritableSignal<Cell> = signal(new Cell());
    public allRuins: WritableSignal<Ruin[]> = signal([]);
    public allCitizens: WritableSignal<Citizen[]> = signal([]);
    public allItems: WritableSignal<Item[]> = signal([]);

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
}
