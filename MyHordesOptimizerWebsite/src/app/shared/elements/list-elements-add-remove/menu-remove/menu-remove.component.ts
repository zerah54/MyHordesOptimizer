import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
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
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class MenuRemoveComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatMenu) menu!: MatMenu;

    @Input() class: string = '';

    @Output() remove: EventEmitter<number | string> = new EventEmitter();
    @Output() empty: EventEmitter<void> = new EventEmitter();

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();
}

