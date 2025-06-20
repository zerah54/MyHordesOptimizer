import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenFromIdPipe } from '../../pipes/citizens-from-id.pipe';
import { AvatarComponent } from '../avatar/avatar.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [AvatarComponent];
const pipes: Imports = [CitizenFromIdPipe];
const material_modules: Imports = [MatTooltipModule];

@Component({
    selector: 'mho-active-citizens',
    templateUrl: './active-citizens.component.html',
    styleUrls: ['./active-citizens.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ActiveCitizensComponent {

    @Input({required: true}) citizenList: number[] = [];
    @Input({required: true}) completeCitizenList: Citizen[] = [];

}
