import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TownListComponent } from '../../directory/town-list/town-list.component';
import { ProfileComponent } from '../profile.component';

@Component({
    selector: 'mho-profile-towns',
    imports: [TownListComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<mho-town-list [playerId]="userId" [reloadToken]="profile.reloadToken()"/>',
    styleUrl: './profile-towns.component.scss',
})
export class ProfileTownsComponent {
    /** Profil parent : l'import (pictos + villes) est piloté depuis son en-tête, au-dessus des onglets. */
    protected readonly profile: ProfileComponent = inject(ProfileComponent);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    /** Le joueur est porté par la route parente (/profile/:userId), pas par celle de l'onglet. */
    protected readonly userId: number | undefined = Number(this.route.parent?.snapshot.paramMap.get('userId')) || undefined;
}
