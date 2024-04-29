import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenFromIdPipe } from '../../pipes/citizens-from-id.pipe';
import { DebugLogPipe } from '../../pipes/debug-log.pipe';
import { AvatarComponent } from '../avatar/avatar.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [AvatarComponent];
const pipes: Imports = [CitizenFromIdPipe, DebugLogPipe];
const material_modules: Imports = [MatTooltipModule];

@Component({
    selector: 'mho-active-citizens',
    templateUrl: './active-citizens.component.html',
    styleUrls: ['./active-citizens.component.scss'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ActiveCitizensComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({ required: true }) citizenList: number[] = [];
    @Input({ required: true }) completeCitizenList: Citizen[] = [];

}
