import { Component, EventEmitter, HostBinding, Input, Output, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { StatusEnum } from 'src/app/_abstract_model/enum/status.enum';
import { Item } from 'src/app/_abstract_model/types/item.class';

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

    @Input() displayAddFilter: boolean = true;
    @Input() addLabel!: string;
    @Output() add: EventEmitter<number | string> = new EventEmitter();

    @Input() displayRemoveFilter: boolean = true;
    @Input() removeLabel!: string;
    @Output() remove: EventEmitter<number | string> = new EventEmitter();

    @Input() emptyLabel!: string;
    @Output() empty: EventEmitter<void> = new EventEmitter();


    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    public locale: string = moment.locale();
}

