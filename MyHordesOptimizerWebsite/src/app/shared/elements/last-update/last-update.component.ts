import { CommonModule, DatePipe, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment, { Moment } from 'moment';
import { Imports } from '../../../_abstract_model/types/_types';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';

const angular_common: Imports = [CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [];
const pipes: Imports = [DatePipe];
const material_modules: Imports = [MatTooltipModule];

@Component({
    selector: 'mho-last-update',
    templateUrl: './last-update.component.html',
    styleUrls: ['./last-update.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class LastUpdateComponent {

    public lastUpdateInfo: InputSignal<UpdateInfo | undefined> = input.required();
    public thresholds: InputSignal<[number, number, number, number] | undefined> = input<[number, number, number, number] | undefined>(undefined);
    public hideDetails: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});

    public moment: Moment = moment();

}

