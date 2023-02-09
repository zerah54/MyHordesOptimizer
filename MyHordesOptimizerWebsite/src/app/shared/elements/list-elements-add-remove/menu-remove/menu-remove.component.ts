import { Component, EventEmitter, HostBinding, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { StatusEnum } from 'src/app/_abstract_model/enum/status.enum';
import { Item } from 'src/app/_abstract_model/types/item.class';

@Component({
    selector: 'mho-menu-remove',
    templateUrl: './menu-remove.component.html',
    styleUrls: ['./menu-remove.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'menuRemove',
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

