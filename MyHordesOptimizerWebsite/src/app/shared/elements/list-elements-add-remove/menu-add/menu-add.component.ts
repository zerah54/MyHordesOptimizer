import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, input, InputSignal, output, OutputEmitterRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { ItemsGroupByCategoryPipe } from '../../../pipes/items-group-by-category.pipe';
import { IsItemsPipe } from '../is-item.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [IsItemsPipe, ItemsGroupByCategoryPipe];
const material_modules: Imports = [MatFormFieldModule, MatInputModule, MatMenuModule, MatTabsModule];

@Component({
    selector: 'mho-menu-add',
    templateUrl: './menu-add.component.html',
    styleUrls: ['./menu-add.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'menuAdd',
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class MenuAddComponent {

    @ViewChild(MatMenu, {static: true}) menu!: MatMenu;

    public class: InputSignal<string> = input('');

    public add: OutputEmitterRef<number | string> = output();

    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();

}

