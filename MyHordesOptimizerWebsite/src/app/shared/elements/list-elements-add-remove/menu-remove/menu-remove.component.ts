import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';

@Component({
    selector: 'mho-menu-remove',
    templateUrl: './menu-remove.component.html',
    styleUrls: ['./menu-remove.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'menuRemove',
    standalone: true,
    imports: [
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        NgFor,
        NgIf,
        NgOptimizedImage,
    ],
})
export class MenuRemoveComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatMenu) menu!: MatMenu;

    @Output() remove: EventEmitter<number | string> = new EventEmitter();
    @Output() empty: EventEmitter<void> = new EventEmitter();

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();
}

