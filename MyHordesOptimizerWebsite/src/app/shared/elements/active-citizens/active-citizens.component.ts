import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenFromIdPipe } from '../../pipes/citizens-from-id.pipe';
import { DebugLogPipe } from '../../pipes/debug-log.pipe';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
    selector: 'mho-active-citizens',
    templateUrl: './active-citizens.component.html',
    styleUrls: ['./active-citizens.component.scss'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, AvatarComponent, MatTooltipModule, CitizenFromIdPipe, DebugLogPipe]
})
export class ActiveCitizensComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({ required: true }) citizenList: number[] = [];
    @Input({ required: true }) completeCitizenList: Citizen[] = [];

}
