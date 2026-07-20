import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TownListComponent } from '../../directory/town-list/town-list.component';

@Component({
    selector: 'mho-admin-towns',
    imports: [TownListComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<mho-town-list [isAdmin]="true"/>`,
    styleUrl: './admin-towns.component.scss',
})
export class AdminTownsComponent {}
