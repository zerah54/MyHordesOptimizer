import { Component, EventEmitter, HostBinding, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { StatusEnum } from 'src/app/_abstract_model/enum/status.enum';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { MenuAddComponent } from './menu-add/menu-add.component';
import { MenuRemoveComponent } from './menu-remove/menu-remove.component';

@Component({
    selector: 'mho-list-element-add-remove',
    templateUrl: './list-element-add-remove.component.html',
    styleUrls: ['./list-element-add-remove.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ListElementAddRemoveComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() currentList: (Item | StatusEnum)[] = [];
    @Input() completeList: (Item | StatusEnum)[] = [];

    @Input() label!: string;

    @Input() addLabel!: string;
    @Output() add: EventEmitter<number | string> = new EventEmitter();
    @Input() set menuAddComponent(menu_add_component: MenuAddComponent) {
        this.add_menu = menu_add_component.menu;
        menu_add_component.add.subscribe((id: number | string) => {
            this.add.next(id);
        })
    };

    @Input() removeLabel!: string;
    @Output() remove: EventEmitter<number | string> = new EventEmitter();
    @Input() set menuRemoveComponent(menu_remove_component: MenuRemoveComponent) {
        this.remove_menu = menu_remove_component.menu;
        menu_remove_component.remove.subscribe((id: number | string) => {
            this.remove.next(id);
        })
    };

    @Input() emptyLabel!: string;
    @Output() empty: EventEmitter<void> = new EventEmitter();


    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();

    public add_menu!: MatMenu;
    public remove_menu!: MatMenu;
}

