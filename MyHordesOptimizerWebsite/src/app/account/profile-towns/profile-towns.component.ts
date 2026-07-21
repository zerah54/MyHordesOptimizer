import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TownListComponent } from '../../directory/town-list/town-list.component';

@Component({
    selector: 'mho-account-towns',
    imports: [TownListComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<mho-town-list [playerId]="userId"/>',
    styleUrl: './account-towns.component.scss',
})
export class AccountTownsComponent {
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    /** Le joueur est porté par la route parente (/account/:userId), pas par celle de l'onglet. */
    protected readonly userId: number | undefined = Number(this.route.parent?.snapshot.paramMap.get('userId')) || undefined;
}
