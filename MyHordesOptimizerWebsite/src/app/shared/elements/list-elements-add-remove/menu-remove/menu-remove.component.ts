import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, input, InputSignal, output, OutputEmitterRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatFormFieldModule, MatInputModule, MatMenuModule];

@Component({
    selector: 'mho-menu-remove',
    templateUrl: './menu-remove.component.html',
    styleUrls: ['./menu-remove.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'menuRemove',
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class MenuRemoveComponent {

    @ViewChild(MatMenu) menu!: MatMenu;

    public class: InputSignal<string> = input('');

    public remove: OutputEmitterRef<number | string> = output();
    public empty: OutputEmitterRef<void> = output();

    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();
}

