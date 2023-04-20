import { Component, EventEmitter, HostBinding, Input, Output, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { Item } from '../../../_abstract_model/types/item.class';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';

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

    @Input() citizen!: Citizen;
    @Input() label!: string;

    @Input() addLabel!: string;
    @Output() add: EventEmitter<number | string> = new EventEmitter();
    // @Input() set menuAddComponent(menu_add_component: MenuAddComponent) {
    //     this.add_menu = menu_add_component.menu;
    //     menu_add_component.add
    //                .pipe(takeUntil(this.destroy_sub))
    //                .subscribe((id: number | string) => {
    //         this.add.next(id);
    //     })
    // };

    @Input() removeLabel!: string;
    @Output() remove: EventEmitter<number | string> = new EventEmitter();
    // @Input() set menuRemoveComponent(menu_remove_component: MenuRemoveComponent) {
    //     this.remove_menu = menu_remove_component.menu;
    //     menu_remove_component.remove
    //                .pipe(takeUntil(this.destroy_sub))
    //                .subscribe((id: number | string) => {
    //         console.log('citizen', this.citizen);
    //         // this.remove.next(id);
    //     })

    //     menu_remove_component.empty
    //                .pipe(takeUntil(this.destroy_sub))
    //                .subscribe(() => {
    //         console.log('citizen', this.citizen);
    //         // this.empty.next();
    //     })
    // };

    @Input() emptyLabel!: string;
    @Output() empty: EventEmitter<void> = new EventEmitter();


    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();

    // public add_menu!: MatMenu;
    // public remove_menu!: MatMenu;
}

