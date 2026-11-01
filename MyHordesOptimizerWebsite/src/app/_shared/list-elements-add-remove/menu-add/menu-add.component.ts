import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    input,
    InputSignal,
    InputSignalWithTransform,
    model,
    ModelSignal,
    output,
    OutputEmitterRef,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { ItemImgPipe } from '../../../_core/pipes/item-img.pipe';
import { ItemsGroupByCategoryPipe } from '../../../_core/pipes/items-group-by-category.pipe';
import { LocalizedLabelPipe } from '../../../_core/pipes/localized-label.pipe';
import { IsItemsPipe } from '../is-item.pipe';
import { ItemsByQuantityPipe } from '../items-by-quantity.pipe';
import { DEFAULT_ITEMS_SORT_MODE, ItemsSortMode } from '../items-sort-mode';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [IsItemsPipe, ItemImgPipe, ItemsByQuantityPipe, ItemsGroupByCategoryPipe, LocalizedLabelPipe];
const material_modules: Imports = [MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatMenuModule];

@Component({
    selector: 'mho-menu-add',
    templateUrl: './menu-add.component.html',
    styleUrls: ['./menu-add.component.scss'],
    exportAs: 'menuAdd',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuAddComponent {

    public readonly menu: Signal<MatMenu> = viewChild.required(MatMenu);

    public class: InputSignal<string> = input('');
    /** Garde le menu ouvert après un ajout, pour en enchaîner plusieurs */
    public keepOpen: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Listes proposées, prioritaires sur celles du `matMenuTriggerData` qui restent figées tant que le menu est ouvert */
    public lists: InputSignal<ListForAddRemove[] | undefined> = input();
    /** Tri des listes qui fournissent leurs quantités ; à lier pour l'enregistrer. */
    public sortMode: ModelSignal<ItemsSortMode> = model<ItemsSortMode>(DEFAULT_ITEMS_SORT_MODE);

    public add: OutputEmitterRef<number | string> = output();

    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();
    /** Liste affichée quand il y en a plusieurs, gardée d'une ouverture du menu à l'autre. */
    protected readonly selected_list: WritableSignal<number> = signal(0);

}

