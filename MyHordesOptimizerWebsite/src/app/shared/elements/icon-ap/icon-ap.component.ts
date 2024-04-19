import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment/moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';

@Component({
    selector: 'mho-icon-ap',
    templateUrl: './icon-ap.component.html',
    styleUrls: ['./icon-ap.component.scss'],
    standalone: true,
    imports: [CommonModule, NgOptimizedImage]
})
export class IconApComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() src: string | undefined;

    protected readonly HORDES_IMG_REPO = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();
}
