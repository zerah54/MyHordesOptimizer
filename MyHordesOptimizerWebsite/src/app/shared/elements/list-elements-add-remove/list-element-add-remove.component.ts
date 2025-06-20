import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, EventEmitter, input, Input, InputSignal, InputSignalWithTransform, Output, ViewEncapsulation } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { IconApComponent } from '../icon-ap/icon-ap.component';
import { CountAvailableApPipe } from './count-available-ap.pipe';
import { IsItemsPipe } from './is-item.pipe';
import { MenuAddComponent } from './menu-add/menu-add.component';
import { MenuRemoveComponent } from './menu-remove/menu-remove.component';

const angular_common: Imports = [CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [IconApComponent, MenuAddComponent, MenuRemoveComponent];
const pipes: Imports = [CountAvailableApPipe, IsItemsPipe];
const material_modules: Imports = [MatMenuModule];

@Component({
    selector: 'mho-list-element-add-remove',
    templateUrl: './list-element-add-remove.component.html',
    styleUrls: ['./list-element-add-remove.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ListElementAddRemoveComponent {

    public currentList: InputSignal<Item[] | StatusEnum[]> = input.required();
    public lists: InputSignal<ListForAddRemove[]> = input.required();

    public label: InputSignal<string> = input.required();
    public class: InputSignal<string> = input('');
    public readonly: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

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
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();

    // public add_menu!: MatMenu;
    // public remove_menu!: MatMenu;
}

