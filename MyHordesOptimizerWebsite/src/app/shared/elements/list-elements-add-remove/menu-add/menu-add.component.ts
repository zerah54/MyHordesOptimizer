import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { ItemsGroupByCategory } from '../../../pipes/items-group-by-category.pipe';
import { IsItemsPipe } from '../is-item.pipe';

@Component({
    selector: 'mho-menu-add',
    templateUrl: './menu-add.component.html',
    styleUrls: ['./menu-add.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'menuAdd',
    standalone: true,
    imports: [
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        CommonModule,
        NgOptimizedImage,
        MatTabsModule,
        IsItemsPipe,
        ItemsGroupByCategory
    ],
})
export class MenuAddComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatMenu, {static: true}) menu!: MatMenu;

    @Input() class: string = '';

    @Output() add: EventEmitter<number | string> = new EventEmitter();

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();

}

