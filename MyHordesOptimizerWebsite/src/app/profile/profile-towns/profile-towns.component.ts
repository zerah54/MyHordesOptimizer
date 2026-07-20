import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TownListComponent } from '../../directory/town-list/town-list.component';

@Component({
    selector: 'mho-profile-towns',
    imports: [TownListComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<mho-town-list [playerId]="userId"/>`,
    styleUrl: './profile-towns.component.scss',
})
export class ProfileTownsComponent {
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    /** Le joueur est porté par la route parente (/profile/:userId), pas par celle de l'onglet. */
    protected readonly userId: number | undefined = Number(this.route.parent?.snapshot.paramMap.get('userId')) || undefined;
}
