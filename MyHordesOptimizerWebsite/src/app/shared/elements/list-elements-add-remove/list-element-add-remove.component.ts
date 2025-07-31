import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, ViewEncapsulation } from '@angular/core';
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

    public addLabel: InputSignal<string> = input.required();
    public add: OutputEmitterRef<number | string> = output();

    public removeLabel: InputSignal<string> = input.required();
    public remove: OutputEmitterRef<number | string> = output();

    public emptyLabel: InputSignal<string> = input.required();
    public empty: OutputEmitterRef<void> = output();


    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public readonly locale: string = moment.locale();

}

