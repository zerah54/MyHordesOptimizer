import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, EventEmitter, HostBinding, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { DebugLogPipe } from '../../pipes/debug-log.pipe';
import { IconApComponent } from '../icon-ap/icon-ap.component';
import { CountAvailableApPipe } from './count-available-ap.pipe';
import { IsItemsPipe } from './is-item.pipe';
import { MenuAddComponent } from './menu-add/menu-add.component';
import { MenuRemoveComponent } from './menu-remove/menu-remove.component';

const angular_common: Imports = [CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [IconApComponent, MenuAddComponent, MenuRemoveComponent];
const pipes: Imports = [CountAvailableApPipe, DebugLogPipe, IsItemsPipe];
const material_modules: Imports = [MatMenuModule];

@Component({
    selector: 'mho-list-element-add-remove',
    templateUrl: './list-element-add-remove.component.html',
    styleUrls: ['./list-element-add-remove.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ListElementAddRemoveComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() currentList: (Item | StatusEnum)[] = [];
    @Input() lists: ListForAddRemove[] = [];

    @Input() citizen!: Citizen;
    @Input() label!: string;
    @Input({ transform: booleanAttribute }) readonly: boolean = false;
    @Input() class: string = '';

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

