import { CommonModule, NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, input, Input, InputSignalWithTransform } from '@angular/core';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DisplayPseudoMode } from '../../../_abstract_model/interfaces';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [];

@Component({
    selector: 'mho-citizen-info',
    templateUrl: './citizen-info.component.html',
    styleUrls: ['./citizen-info.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizenInfoComponent {

    @Input() citizen!: Citizen;
    @Input() displayPseudoMode: DisplayPseudoMode = 'simple';
    public displayShunStatus: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public displayJob: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});

    /** La langue du site */
    protected readonly locale: string = moment.locale();
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
}
