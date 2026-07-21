import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, input, InputSignal, output, OutputEmitterRef, Signal, viewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { ItemsGroupByCategoryPipe } from '../../../_core/pipes/items-group-by-category.pipe';
import { IsItemsPipe } from '../is-item.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [IsItemsPipe, ItemsGroupByCategoryPipe];
const material_modules: Imports = [MatFormFieldModule, MatInputModule, MatMenuModule, MatTabsModule];

@Component({
    selector: 'mho-menu-add',
    templateUrl: './menu-add.component.html',
    styleUrls: ['./menu-add.component.scss'],
    exportAs: 'menuAdd',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class MenuAddComponent {

    public readonly menu: Signal<MatMenu> = viewChild.required(MatMenu);

    public class: InputSignal<string> = input('');

    public add: OutputEmitterRef<number | string> = output();

    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();

}

