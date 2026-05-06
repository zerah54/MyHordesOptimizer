import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [];

@Component({
    selector: 'mho-icon-ep',
    templateUrl: './icon-ep.component.html',
    styleUrls: ['./icon-ep.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class IconEpComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() src: string | undefined;

    /** L'url des images de hordes */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();
}
