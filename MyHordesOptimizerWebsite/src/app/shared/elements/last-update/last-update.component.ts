import { CommonModule, DatePipe, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, input, Input, InputSignalWithTransform } from '@angular/core';
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

    @Input() lastUpdateInfo: UpdateInfo | undefined;
    @Input() thresholds!: [number, number, number, number];
    public hideDetails: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});

    public moment: Moment = moment();

}

